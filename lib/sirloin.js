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
const FILES = 'dist'

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

class Sirloin {
  constructor(config = {}) {
    this.middleware = []

    // Init APIs
    this.api = {}

    // Set up config
    config.port = config.port || PORT
    if (config.pubsub === true) config.pubsub = {}

    switch(typeof config.files) {
      case 'undefined': config.files = FILES
      case 'string':
        if(!fs.existsSync(config.files)) {
          config.files = false
        }
    }

    if (config.ssl) {
      config.ssl.key = fs.readFileSync(config.ssl.key, 'utf8')
      config.ssl.cert = fs.readFileSync(config.ssl.cert, 'utf8')
    }
    this.config = config

    // Init routes
    const routes = {}
    for (const m of METHODS) {
      routes[m] = {}
      this[m.toLowerCase()] = (path, fn) => {
        routes[m][path] = fn
      }
    }

    const client = libs[config.ssl ? 'https' : 'http']

    const http = client.createServer(
      config.ssl,
      async (req, res) => {
        rekvest(req)
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        cookie(req)
        let data

        // Run middleware
        for (const mw of this.middleware) {
          data = await this.run('http', mw, req, res)
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
              data = await this.run('http', route, req, res)
            }
          }
        }

        // Serve static if still no match
        const { files } = config
        if (typeof files === 'string' &&
          typeof data === 'undefined' &&
          ['GET', 'HEAD'].includes(req.method)
          ) {
          serveStatic(req, res, { dir: files })
        } else {
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
    this.actions = {}
    this.callbacks = {}

    this.websocket = new ws.Server({ server: http })
    this.websocket.on('connection', async (client, req) => {
      rekvest(req)
      client.req = req
      client.isAlive = true
      client.id = uuid()
      client.websocket = this

      // Modify client send function
      client.deliver = client.send
      client.send = (data, _options, _fn) => {
        const { options, fn } = normalizeArgs(_options, _fn)
        return new Promise(resolve => {
          if (typeof data === 'object') {
            data = JSON.stringify(data)
          }
          client.deliver(data, options, () => fn ? fn() : resolve())
        })
      }
      client.publish = function(name, data, options, fn) {
        return this.websocket.publish(name, data, options, fn, this)
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
        const action = this.actions[name]
        delete data[ACTIONID]
        // console.log('ACTION %s\n%s\n', name, JSON.stringify(data))

        if (action) {
          const result = await this.run('websocket', action, data, client)
          if (typeof result !== 'undefined') {
            if (id) {
              result[CBID] = id
            }
            client.send(result)
          }
        }
      })
    })

    this.interval = setInterval(() => {
      this.websocket.clients.forEach(client => {
        if (client.isAlive === false) {
          return client.terminate()
        }
        client.isAlive = false
        client.ping('', false, true)
      })
    }, TIMEOUT)

    if (config.pubsub) {
      this.settings = { ...OPTIONS, ...config.pubsub }
      this.connected = false
      this.channel = new Redis(this.settings)

      const hub = new Redis(this.settings)
      hub.subscribe(this.settings.channel, (err) => {
        if (err) {
          console.log('Pubsub channel unavailable \'%s\':\n%s', this.settings.channel, err.message)
          throw err
        } else {
          console.log('Pubsub subscribed to channel \'%s\'', this.settings.channel)
          this.connected = true
        }
      })
      hub.on('message', async (channel, msg) => {
        const { name, data, options } = JSON.parse(msg)
        const { clientid, cbid } = options
        const clients = [...this.websocket.clients]
        const client = clients.find(c => c.id == clientid)
        const callback = this.callbacks[cbid]
        delete this.callbacks[cbid]
        await this.api[name](data, client)
        if (client && callback) callback()
      })
    }
  }

  pubsub(name, data, options) {
    if (this.connected) {
      const msg = JSON.stringify({ name, data, options })
      this.channel.publish(this.settings.channel, msg)
    }
  }

  subscribe(name, fn) {
    this.api[name] = fn
  }

  use(fn) {
    this.middleware.push(fn)
  }

  async run(type, fn, ...args) {
    try {
      return await fn(...args)
    } catch (err) {
      const e = this.api[type === 'websocket' ? 'fail' : 'error']
      if (e) {
        return await e(err, ...args)
      } else {
        throw err
      }
    }
  }

  any(...args) {
    const [fn, path] = args.reverse()
    this.all(path, fn)
  }

  all(path, fn, methods = METHODS) {
    for (const m of methods) {
      this[m.toLowerCase()](path, fn)
    }
  }

  action(name, fn) {
    this.actions[name] = fn
  }

  error(fn) {
    this.api.error = fn
  }

  fail(fn) {
    this.api.fail = fn
  }

  publish(name, data, _options, _fn, client) {
    let { options, fn } = normalizeArgs(_options, _fn)
    return new Promise(resolve => {
      if (client) {
        options.clientid = client.id
      }
      switch (typeof fn) {
        case 'undefined': fn = () => resolve()
        case 'function':
          options.cbid = uuid()
          this.callbacks[options.cbid] = fn
      }
      this.pubsub(name, data, options)
    })
  }
}

module.exports = Sirloin
