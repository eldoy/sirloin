const util = require('util')
const fs = require('fs')
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

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

function log(msg, data = {}) {
  if (process.env.NODE_ENV != 'production') {
    console.log(`\n${msg}\n${util.inspect(data)}`)
  }
}

module.exports = function(config = {}) {

  /***************************************************************
  /* CONFIG
  ***************************************************************/

  // Set up config
  if (typeof config.port == 'undefined') {
    config.port = 3000
  }
  if (typeof config.dir == 'undefined') {
    config.dir = 'dist'
  }
  if (typeof config.dir == 'string' && !fs.existsSync(config.dir)) {
    config.dir = false
  }
  if (config.ssl) {
    config.ssl.key = fs.readFileSync(config.ssl.key, 'utf8')
    config.ssl.cert = fs.readFileSync(config.ssl.cert, 'utf8')
  }
  if (config.pubsub === true) {
    config.pubsub = {}
  }


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
      data = await run('http', mw, req, res)
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
          data = await run('http', route, req, res)
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
        const result = await run('websocket', action, data, client)
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
    await api[name](data, client)
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
  for (const m of METHODS) {
    routes[m] = {}
  }

  // Holds middleware functions
  const middleware = []

  // Holds websocket actions
  const actions = {}

  // Holds the internal APIs
  const api = {}

  // Run api functions
  async function run(type, fn, ...args) {
    try {
      return await fn(...args)
    } catch (err) {
      const e = api[type == 'websocket' ? 'fail' : 'error']
      if (e) {
        return await e(err, ...args)
      } else {
        throw err
      }
    }
  }

  // Match any method
  function any(...args) {
    const [fn, path] = args.reverse()
    all(path, fn)
  }

  // Match specific methods
  function all(path, fn, methods = METHODS) {
    for (const m of methods) {
      server[m.toLowerCase()](path, fn)
    }
  }

  // Use middleware
  function use(fn) {
    middleware.push(fn)
  }

  // Match action name
  function action(name, fn) {
    actions[name] = fn
  }

  // Subscribe to publish
  function subscribe(name, fn) {
    api[name] = fn
  }

  // HTTP error
  function error(fn) {
    api.error = fn
  }

  // Websocket fail
  function fail(fn) {
    api.fail = fn
  }

  // Public functions and properties
  var server = {
    any,
    all,
    use,
    action,
    subscribe,
    error,
    fail,
    http,
    websocket,
    publish,
    config
  }

  // Generate verb functions
  for (const m of METHODS) {
    server[m.toLowerCase()] = function(path, fn) {
      routes[m][path] = fn
    }
  }

  return server
}
