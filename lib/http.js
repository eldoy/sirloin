const http = require('http')
const bodyparser = require('bparse')
const Files = require('./files')
const tools = require('./tools')

class Http {
  constructor (app) {
    this.app = app
    this.routes = {}
    this.files = new Files(app)
    this.request = this.request.bind(this)
    this.server = http.createServer(this.request).listen(app.config.port)
  }

  async request (req, res) {
    this.setResponseHeaders(res)
    tools.setRequestProperties(req)
    await this.runMiddleware(req, res)
    this.printRequest(req)
    let data = await this.processRoute(req, res)
    if (typeof data === 'undefined') {
      data = this.files.processStatic(req, res)
    }
    this.send(res, data)
  }

  setResponseHeaders (res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
  }

  async runMiddleware (req, res) {
    for (const fn of this.app.middleware) {
      await fn(req, res)
    }
  }

  printRequest (req) {
    if (process.env.NODE_ENV !== 'production') {
      process.stdout.write(`${req.method} ${req.path}\n`)
      process.stdout.write(`${JSON.stringify(req.query)}\n\n`)
    }
  }

  async processRoute (req, res) {
    if (req.method === 'OPTIONS') {
      return {}
    }
    const routes = this.routes[req.method]
    if (routes) {
      const route = routes[req.pathname] || routes['*']
      if (route) {
        if (req.method !== 'GET') {
          await bodyparser(req)
        }
        const result = route(req, res)
        if (result) {
          return result
        }
      }
    }
  }

  send (res, data) {
    switch (typeof data) {
      case 'undefined': data = this.notFound(res)
      case 'object': data = JSON.stringify(data)
      default: data = data + ''
    }
    res.setHeader('Content-Length', Buffer.byteLength(data))
    res.end(data)
  }

  notFound (res) {
    res.statusCode = 404
    return {}
  }
}

module.exports = Http