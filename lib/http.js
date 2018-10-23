const http = require('http')
const tools = require('./tools')

class Http {
  constructor (app) {
    this.app = app
    this.routes = {}
    this.createServer()
  }

  listen (name, port = this.app.config.port) {
    tools.log.info('Sirloin %s listening on port %d', name, port)
    this.server.listen(port)
  }

  createServer () {
    this.server = http.createServer(this.request.bind(this))
  }

  initRequest (req, res) {
    this.setResponseHeaders(res)
    tools.setRequestProperties(req)
    this.printRequest(req)
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

  setResponseHeaders (res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
  }

  notFound (res) {
    res.statusCode = 404
    return {}
  }

  printRequest (req) {
    tools.log.info('%s %s\n%o\n', req.method, req.path, req.query)
  }
}

module.exports = Http