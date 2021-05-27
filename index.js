const util = require('util')
const fs = require('fs')
const libs = {
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
const PORT = 3000

const OPTIONS = { channel: 'messages' }

const TIMEOUT = 30000
const ACTIONID = '$action'

function log(msg, data = {}) {
  if (process.env.NODE_ENV != 'production') {
    console.log(`\n${msg}\n${util.inspect(data)}`)
  }
}

module.exports = function(config = {}) {
  let settings = null
  let connected = false
  let channel = null
  const middleware = []

  // Init APIs
  const api = {}

  // Set up config
  let { pubsub, dir, ssl, connect, port = PORT } = config
  if (pubsub === true) pubsub = {}
  if (typeof dir == 'undefined') dir = 'dist'
  if (typeof dir == 'string' && !fs.existsSync(dir)) dir = false
  if (ssl) {
    ssl.key = fs.readFileSync(ssl.key, 'utf8')
    ssl.cert = fs.readFileSync(ssl.cert, 'utf8')
  }

  // Init routes
  const routes = {}
  for (const m of METHODS) routes[m] = {}

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

  // Create HTTP server
  const client = libs[ssl ? 'https' : 'http']
  const http = client.createServer(ssl, async (req, res) => {
    rekvest(req)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    cookie(req)
    let data, assetRequest = ['GET', 'HEAD'].includes(req.method)

    // Log request
    if (!assetRequest) log(`HTTP ${req.pathname}`, req.params)

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
    if (typeof dir == 'string' && typeof data == 'undefined' && assetRequest) {
      serveStatic(req, res, { dir })
    } else {

      // Serve data requests
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
  })

  // Listen to port
  http.listen(port)
  console.log('Web server is listening on port %d', port)

  // Set up web socket
  const actions = {}
  const callbacks = {}
  const websocket = new ws.Server({ server: http })
  websocket.on('connection', async (client, req) => {
    rekvest(req)

    // Additional properties
    client.req = req
    client.isAlive = true
    client.id = uuid()

    // Support promises and JSON for client send
    client.deliver = client.send
    client.send = (data, options = {}, fn) => {
      if (typeof options == 'function') {
        fn = options; options = {}
      }
      if (typeof data == 'object') {
        data = JSON.stringify(data)
      }
      return new Promise(resolve => {
        client.deliver(data, options, () => fn ? fn() : resolve())
      })
    }
    client.publish = (name, data, options, fn) => {
      return publish(name, data, options, fn, client)
    }
    if (connect) await connect(client)
    client.on('pong', () => client.isAlive = true)
    client.on('close', () => client.isAlive = false)
    client.on('message', async (data) => {
      // Extract data and action
      data = JSON.parse(data)
      const name = data[ACTIONID] || '*'
      const action = actions[name]
      delete data[ACTIONID]

      // Log request
      log(`WS /${name}`, data)

      // Run action and send result
      if (action) {
        const result = await run('websocket', action, data, client)
        if (typeof result != 'undefined') {
          client.send(result)
        }
      }
    })
  })

  // Terminate stale clients
  setInterval(() => {
    websocket.clients.forEach(client => {
      if (client.isAlive === false) {
        return client.terminate()
      }
      client.isAlive = false
      client.ping(function(){})
    })
  }, TIMEOUT)

  if (pubsub) {
    // Pubsub settings
    settings = { ...OPTIONS, ...pubsub }

    // Channel to send on
    channel = new Redis(settings)

    // Hub is the channel to receive on
    const hub = new Redis(settings)

    // Subscribe to channel name in settings
    hub.subscribe(settings.channel, (err) => {
      if (err) {
        console.log('Pubsub channel unavailable \'%s\':\n%s', settings.channel, err.message)
        throw err
      } else {
        console.log('Pubsub subscribed to channel \'%s\'', settings.channel)
        connected = true
      }
    })

    // Receive messages here from publish
    hub.on('message', async (channel, msg) => {
      const { name, data, options } = JSON.parse(msg)
      const { clientid, cbid } = options
      const client = [...websocket.clients].find(c => c.id == clientid)
      const callback = callbacks[cbid]
      delete callbacks[cbid]
      await api[name](data, client)
      if (callback) callback()
    })
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

  // Publish to pubsub channel
  function publish(name, data, options = {}, fn, client) {
    if (typeof options == 'function') {
      fn = options; options = {}
    }
    if (client) options.clientid = client.id
    return new Promise(resolve => {
      if (typeof fn == 'undefined') fn = () => resolve()
      if (typeof fn == 'function') {
        options.cbid = uuid()
        callbacks[options.cbid] = fn
      }
      if (connected) {
        const msg = JSON.stringify({ name, data, options })
        channel.publish(settings.channel, msg)
      }
    })
  }

  // Public functions and properties
  const server = { any, all, use, action, subscribe, error, fail, publish, http, websocket }

  // Generate verb functions
  for (const m of METHODS) {
    server[m.toLowerCase()] = function(path, fn) {
      routes[m][path] = fn
    }
  }

  return server
}
