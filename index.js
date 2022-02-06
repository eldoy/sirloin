const util = require('util')
const protocols = {
  http: require('http'),
  https: require('https')
}
const bodyParser = require('bparse')
const serveStatic = require('hangersteak')
const cookie = require('wcookie')

const Redis = require('ioredis')

const { v4: uuid } = require('uuid')
const ws = require('ws')
const rekvest = require('rekvest')

const configure = require('./lib/configure.js')
const run = require('./lib/run.js')

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

function log(msg, data = {}) {
  if (process.env.NODE_ENV != 'production') {
    console.log(`\n${msg}\n${util.inspect(data)}`)
  }
}

module.exports = function(config = {}) {

  const api = {}

  configure(config)

  /***************************************************************
  /* HTTP
  ***************************************************************/

  // Serve data requests
  function serveData(req, res, data) {
    switch (typeof data) {
      case 'undefined': res.statusCode = 404
      case 'object': data = JSON.stringify(data || '')
      default: data = String(data)
    }
    if (req.cookieJar && req.cookieJar.length) {
      res.setHeader('set-cookie', req.cookieJar.headers)
    }
    res.setHeader('content-length', Buffer.byteLength(data))
    res.end(data)
  }

  // The http request callback
  async function httpRequest(req, res) {
    rekvest(req)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    cookie(req)
    let data, isStaticRequest = ['GET', 'HEAD'].includes(req.method)

    // Log request
    if (!isStaticRequest) {
      log(`HTTP ${req.pathname}`, req.params)
    }

    // Run middleware
    for (const mw of middleware) {
      data = await run(mw, handlers.error, req, res)
      if (typeof data != 'undefined') break
    }

    // Process route
    if (typeof data == 'undefined') {
      if (req.method == 'OPTIONS') data = ''
      const map = routes[req.method]
      if (map) {
        const route = map[req.pathname] || map['*']
        if (route) {
          if (req.method == 'POST') await bodyParser(req)
          data = await run(route, handlers.error, req, res)
        }
      }
    }

    // Serve static if still no match
    if (typeof config.dir == 'string' && typeof data == 'undefined' && isStaticRequest) {
      serveStatic(req, res, { dir: config.dir })
    } else {
      serveData(req, res, data)
    }
  }

  // Create HTTP server
  const client = protocols[config.ssl ? 'https' : 'http']
  const http = client.createServer(config.ssl, httpRequest)

  // Listen to port
  http.listen(config.port)
  console.log('Web server is listening on port %d', config.port)


  /***************************************************************
  * WEBSOCKET
  ***************************************************************/

  // Set up web socket
  const websocket = new ws.Server({ server: http })

  // The websocket callback
  async function websocketRequest(client, req) {
    rekvest(req)

    // Additional properties
    client.req = req
    client.isAlive = true
    client.id = uuid()

    // Support promises and JSON for client send
    client.deliver = client.send

    client.send = function(data, options = {}, fn) {
      if (typeof options == 'function') {
        fn = options
        options = {}
      }
      if (typeof data == 'object') {
        data = JSON.stringify(data)
      }
      return new Promise(resolve => {
        client.deliver(data, options, () => fn ? fn() : resolve())
      })
    }

    client.publish = function(name, data, options, fn) {
      return publish(name, data, options, fn, client)
    }

    // Run websocket connect callback
    if (typeof config.connect == 'function') {
      await config.connect(client)
    }

    client.on('pong', () => client.isAlive = true)
    client.on('close', () => client.isAlive = false)

    async function webSocketMessage(data) {
      // Extract data and action
      data = JSON.parse(data)
      const name = data.$action || '*'
      const action = actions[name]
      delete data.$action

      // Log request
      log(`WS /${name}`, data)

      // Run action and send result
      if (action) {
        const result = await run(action, handlers.fail, data, client)
        if (typeof result != 'undefined') {
          client.send(result)
        }
      }
    }
    client.on('message', webSocketMessage)
  }

  websocket.on('connection', websocketRequest)

  // Terminate stale clients
  function terminateStaleClients() {
    websocket.clients.forEach(client => {
      if (client.isAlive === false) {
        return client.terminate()
      }
      client.isAlive = false
      client.ping(function(){})
    })
  }

  setInterval(terminateStaleClients, 30000)


  /***************************************************************
  /* PUBSUB
  ***************************************************************/

  // The name of the pubsub channel
  let channel

  // The pubsub publisher
  let publisher

  // The pubsub receiver
  let receiver

  // Whether or not we are connected to pubsub
  let connected

  // Holds pubsub callbacks
  const callbacks = {}

  if (config.pubsub) {
    if (!channel) {
      channel = 'messages'
    }

    // Channel to send on
    publisher = new Redis(config.pubsub)

    // Receiver is the channel to receive on
    receiver = new Redis(config.pubsub)

    receiver.subscribe(channel, subscribeChannel)
    receiver.on('message', pubsubMessage)
  }

  // Subscribe to config channel name
  function subscribeChannel(err) {
    if (err) {
      console.log(`Pubsub channel '${channel}' is unavailable`)
      console.log(err.message)
      throw err
    } else {
      console.log(`Pubsub subscribed to channel '${channel}'`)
      connected = true
    }
  }

  // Receive messages here from publish
  async function pubsubMessage(channel, msg) {
    const { name, data, options } = JSON.parse(msg)
    const { clientid, cbid } = options
    const client = [...websocket.clients].find(c => c.id == clientid)
    const callback = callbacks[cbid]
    delete callbacks[cbid]
    await handlers[name](data, client)
    if (callback) callback()
  }

  // Publish to pubsub channel
  function publish(name, data, options = {}, fn, client) {
    if (typeof options == 'function') {
      fn = options
      options = {}
    }
    if (client) {
      options.clientid = client.id
    }
    return new Promise(resolve => {
      if (typeof fn == 'undefined') {
        fn = () => resolve()
      }
      if (typeof fn == 'function') {
        options.cbid = uuid()
        callbacks[options.cbid] = fn
      }
      if (connected) {
        const msg = JSON.stringify({ name, data, options })
        publisher.publish(channel, msg)
      }
    })
  }


  /***************************************************************
  /* API
  ***************************************************************/




  // Init HTTP routes
  const routes = {}

  // Middleware functions
  const middleware = []

  // Websocket actions
  const actions = {}

  // Custom handler functions
  const handlers = {}

  // Generate verb functions
  for (const m of METHODS) {
    routes[m] = {}
    api[m.toLowerCase()] = function(path, fn) {
      routes[m][path] = fn
    }
  }

  // Match specific methods
  api.all = function(path, fn, methods = METHODS) {
    for (const m of methods) {
      api[m.toLowerCase()](path, fn)
    }
  }

  // Match any method
  api.any = function(...args) {
    const [fn, path] = args.reverse()
    api.all(path, fn)
  }

  // Use middleware
  api.use = function(fn) {
    middleware.push(fn)
  }

  // Match action name
  api.action = function(name, fn) {
    actions[name] = fn
  }

  // Subscribe to publish
  api.subscribe = function(name, fn) {
    handlers[name] = fn
  }

  // HTTP error
  api.error = function(fn) {
    handlers.error = fn
  }

  // Websocket fail
  api.fail = function(fn) {
    handlers.fail = fn
  }

  // Public functions and properties
  api.http = http
  api.websocket = websocket
  api.publish = publish
  api.config = config

  return api
}
