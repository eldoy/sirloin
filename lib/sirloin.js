const fs = require('fs')
const http = require('http')
const https = require('https')
const rekvest = require('rekvest')
const bodyParser = require('bparse')
const serveStatic = require('hangersteak')
const cookie = require('wcookie')
const Websocket = require('./websocket.js')

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const APIS = ['error', 'fail']
const PORT = 3000
const FILES = 'dist'

class Sirloin {
  constructor(config = {}) {
    this.middleware = []

    // Init APIs
    this.api = {}
    for (const a of APIS) {
      this[a] = fn => this.api[a] = fn
    }

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
    this.routes = {}
    for (const m of METHODS) {
      this.routes[m] = {}
      this[m.toLowerCase()] = (path, fn) => {
        this.routes[m][path] = fn
      }
    }

    const client = config.ssl ? https : http

    this.http = client.createServer(
      config.ssl,
      async (req, res) => {
        rekvest(req)
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        cookie(req)
        let data

        // Run middleware
        for (const fn of this.middleware) {
          data = await this.run('http', fn, req, res)
          if (typeof data !== 'undefined') {
            break
          }
        }

        // Process route
        if (typeof data === 'undefined') {
          if (req.method === 'OPTIONS') {
            data = ''
          }
          const map = this.routes[req.method]
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
        if (typeof data === 'undefined' &&
          ['GET', 'HEAD'].includes(req.method) &&
          typeof files === 'string') {
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

    const port = config.port
    this.http.listen(port)
    console.log('Web server is listening on port %d', port)
  }

  subscribe(name, fn) {
    if (APIS.includes(name)) {
      throw new Error(`Invalid name for subscribe: ${name}`)
    }
    this.api[name] = fn
  }

  publish(...args) {
    return this.websocket.publish(...args)
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
    if (!this.websocket) {
      this.websocket = new Websocket(this)
    }
    this.websocket.actions[name] = fn
  }
}

module.exports = Sirloin
