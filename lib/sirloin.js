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
const CBID = '$cbid'
const ACTIONID = '$action'

function normalizeArgs(options, fn) {
  switch (typeof options) {
    case 'function': fn = options; options = {}
    case 'undefined': options = {}
  }
  return { options, fn }
}

function log(msg, data = {}) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${msg}\n${util.inspect(data)}\n`)
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
  config.port = config.port || PORT
  if (config.pubsub === true) config.pubsub = {}

  switch(typeof config.dir) {
    case 'undefined': config.dir = 'dist'
    case 'string':
      if(!fs.existsSync(config.dir)) {
        config.dir = false
      }
  }

  if (config.ssl) {
    config.ssl.key = fs.readFileSync(config.ssl.key, 'utf8')
    config.ssl.cert = fs.readFileSync(config.ssl.cert, 'utf8')
  }

  // Init routes
  const routes = {}
  for (const m of METHODS) {
    routes[m] = {}
  }

  // Run api functions
  const run = async (type, fn, ...args) => {
    try {
      return await fn(...args)
    } catch (err) {
      const e = api[type === 'websocket' ? 'fail' : 'error']
      if (e) {
        return await e(err, ...args)
      } else {
        throw err
      }
    }
  }

  // Create HTTP server
  const client = libs[config.ssl ? 'https' : 'http']
  const http = client.createServer(
    config.ssl,
    async (req, res) => {
      rekvest(req)
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      cookie(req)
      let data

      // Run middleware
      for (const mw of middleware) {
        data = await run('http', mw, req, res)
        if (typeof data !== 'undefined') {
          break
        }
      }

      // Process route
      if (typeof data === 'undefined') {
        if (req.method === 'OPTIONS') {
          data = ''
        }
        const map = routes[req.method]
        if (map) {
          const route = map[req.pathname] || map['*']
          if (route) {
            if (req.method !== 'GET') {
              await bodyParser(req)
            }
            data = await run('http', route, req, res)
          }
        }
      }

      // Log request
      log(`HTTP ${req.pathname}`, req.params)

      // Serve static if still no match
      const { dir } = config
      if (typeof dir === 'string' &&
        typeof data === 'undefined' &&
        ['GET', 'HEAD'].includes(req.method)
        ) {
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
    }
  )

  // Listen to port
  const port = config.port
  http.listen(port)
  console.log('Web server is listening on port %d', port)

  // Set up web socket
  const actions = {}
  const callbacks = {}

  const websocket = new ws.Server({ server: http })
  websocket.on('connection', async (client, req) => {
    rekvest(req)
    client.req = req
    client.isAlive = true
    client.id = uuid()

    // Support promises and JSON for client send
    client.deliver = client.send
    client.send = (data, opt, f) => {
      const { options, fn } = normalizeArgs(opt, f)
      return new Promise(resolve => {
        if (typeof data === 'object') {
          data = JSON.stringify(data)
        }
        client.deliver(data, options, () => fn ? fn() : resolve())
      })
    }
    client.publish = (name, data, options, fn) => {
      return app.publish(name, data, options, fn, client)
    }
    if (config.connect) {
      await config.connect(client)
    }
    client.on('pong', () => client.isAlive = true)
    client.on('close', () => client.isAlive = false)
    client.on('message', async (data) => {
      data = JSON.parse(data)
      const id = data[CBID]
      delete data[CBID]
      const name = data[ACTIONID] || '*'
      const action = actions[name]
      delete data[ACTIONID]

      // Log request
      log(`WS /${name}`, data)

      if (action) {
        const result = await run('websocket', action, data, client)
        if (typeof result !== 'undefined') {
          if (id) {
            result[CBID] = id
          }
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
      client.ping('', false, true)
    })
  }, TIMEOUT)

  if (config.pubsub) {
    settings = { ...OPTIONS, ...config.pubsub }
    channel = new Redis(settings)

    const hub = new Redis(settings)
    hub.subscribe(settings.channel, (err) => {
      if (err) {
        console.log('Pubsub channel unavailable \'%s\':\n%s', settings.channel, err.message)
        throw err
      } else {
        console.log('Pubsub subscribed to channel \'%s\'', settings.channel)
        connected = true
      }
    })
    hub.on('message', async (channel, msg) => {
      const { name, data, options } = JSON.parse(msg)
      const { clientid, cbid } = options
      const clients = [...websocket.clients]
      const client = clients.find(c => c.id == clientid)
      const callback = callbacks[cbid]
      delete callbacks[cbid]
      await api[name](data, client)
      if (client && callback) callback()
    })
  }

  var app = {}

  app.subscribe = function(name, fn) {
    api[name] = fn
  }

  app.use = function(fn) {
    middleware.push(fn)
  }

  app.any = function(...args) {
    const [fn, path] = args.reverse()
    app.all(path, fn)
  }

  app.all = function(path, fn, methods = METHODS) {
    for (const m of methods) {
      app[m.toLowerCase()](path, fn)
    }
  }

  app.action = function(name, fn) {
    actions[name] = fn
  }

  app.error = function(fn) {
    api.error = fn
  }

  app.fail = function(fn) {
    api.fail = fn
  }

  app.publish = function(name, data, opt, f, client) {
    let { options, fn } = normalizeArgs(opt, f)
    return new Promise(resolve => {
      if (client) {
        options.clientid = client.id
      }
      switch (typeof fn) {
        case 'undefined': fn = () => resolve()
        case 'function':
          options.cbid = uuid()
          callbacks[options.cbid] = fn
      }
      if (connected) {
        const msg = JSON.stringify({ name, data, options })
        channel.publish(settings.channel, msg)
      }
    })
  }

  for (const m of METHODS) {
    app[m.toLowerCase()] = function(path, fn) {
      routes[m][path] = fn
    }
  }

  app.websocket = websocket
  app.http = http

  return app
}
