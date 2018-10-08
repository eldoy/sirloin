const mime = require('mime-types')
const fs = require('fs')
const http = require('http')
const url = require('url')
const bodyparser = require('bparse')

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

class Webserver {
  constructor (options = {}) {
    this.setOptions(options)
    this.initRoutes()
    this.http = http.createServer(async (req, res) => {
      this.setResponseHeaders(res)
      this.setRequestProperties(req)
      this.printRequest(req)
      const data = await this.processRoute(req, res)
        || this.processStatic(req, res)
        || this.notFound(req, res)
      this.send(res, data)
    }).listen(options.port)
  }

  setOptions (options) {
    if (!options.port) {
      options.port = 3000
    }
    if (options.static !== false) {
      options.static = 'dist'
    }
    this.options = options
  }

  initRoutes () {
    this.routes = {}
    for (const m of METHODS) {
      this.routes[m] = {}
      this[m.toLowerCase()] = (path, fn) => {
        this.routes[m][path] = fn
      }
    }
  }

  setRequestProperties (req) {
    const uri = url.parse(req.url, true)
    req.path = uri.path
  }

  setResponseHeaders (res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
  }

  printRequest (req) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${req.method} ${req.path}\n`)
    }
  }

  any (path, fn) {
    for (const m of METHODS) {
      this[m.toLowerCase()](path, fn)
    }
  }

  send (res, data) {
    if (typeof data === 'object') {
      data = JSON.stringify(data)
    }
    res.setHeader('Content-Length', Buffer.byteLength(data))
    res.end(data)
  }

  async processRoute (req, res) {
    const routes = this.routes[req.method]
    if (routes) {
      const route = routes[req.path] || routes['*']
      if (route) {
        if (req.method === 'POST') {
          await bodyparser(req)
        }
        const result = route(req, res)
        if (result) {
          return result
        }
      }
    }
  }

  processStatic (req, res) {
    if (!this.options.static) {
      return
    }
    let path = `${this.options.static}/${req.path}`
    if (path.slice(-1) === '/') {
      path += 'index.html'
    }
    if (fs.existsSync(path)) {
      const file = fs.readFileSync(path, 'utf8')
      const type = mime.lookup(path) || 'text/plain'
      res.setHeader('Content-Type', type)
      return file
    }
  }

  notFound (req, res) {
    res.statusCode = 404
    return {}
  }
}

module.exports = Webserver