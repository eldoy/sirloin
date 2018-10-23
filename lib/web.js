const http = require('http')
const bodyparser = require('bparse')
const Files = require('./files')
const tools = require('./tools')

class Web {
  constructor (app) {
    this.app = app
    this.routes = {}
    this.files = new Files(app)
    this.createServer()
    this.listen()
  }

  createServer () {
    this.server = http.createServer(this.request.bind(this))
  }

  listen (port = this.app.config.port) {
    tools.log.info('Sirloin http listening on port %d', port)
    this.server.listen(port)
  }

  async request (req, res) {
    tools.setResponseHeaders(res)
    tools.setRequestProperties(req)
    this.printRequest(req)
    let data = await this.runMiddleware(req, res)
    if (typeof data === 'undefined') {
      data = await this.processRoute(req, res)
    }
    if (typeof data === 'undefined') {
      data = this.files.processStatic(req, res)
    }
    this.send(res, data)
  }

  async runMiddleware (req, res) {
    for (const fn of this.app.middleware) {
      const data = await this.app.run('http', fn, req, res)
      if (typeof data !== 'undefined') {
        return data
      }
    }
  }

  printRequest (req) {
    tools.log.info('%s %s\n%o\n', req.method, req.path, req.query)
  }

  async processRoute (req, res) {
    if (req.method === 'OPTIONS') {
      return ''
    }
    const routes = this.routes[req.method]
    if (routes) {
      const route = routes[req.pathname] || routes['*']
      if (route) {
        if (req.method !== 'GET') {
          await bodyparser(req)
        }
        const result = await this.app.run('http', route, req, res)
        if (typeof result !== 'undefined') {
          return result
        }
      }
    }
  }

  send (res, data) {
    switch (typeof data) {
      case 'undefined': data = tools.notFound(res)
      case 'object': data = JSON.stringify(data)
      default: data = data + ''
    }
    res.setHeader('Content-Length', Buffer.byteLength(data))
    res.end(data)
  }
}

module.exports = Web