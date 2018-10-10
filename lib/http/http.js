const http = require('http')
const bodyparser = require('bparse')
const Files = require('./files')
const tools = require('../tools')

class Http {
  constructor (app) {
    this.request = this.request.bind(this)
    this.app = app
    this.routes = {}
    this.files = new Files(app)
    this.server = http.createServer(this.request).listen(app.options.port)
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

  async request (req, res) {
    this.setResponseHeaders(res)
    tools.setRequestProperties(req)
    this.printRequest(req)
    const data = await this.processRoute(req, res)
      || this.files.processStatic(req, res)
      || this.notFound(req, res)
    this.send(res, data)
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

  notFound (req, res) {
    res.statusCode = 404
    return {}
  }
}

module.exports = Http