const http = require('http')
const tools = require('./tools')

class Base {
  constructor(app) {
    this.app = app
    this.routes = {}
    this.server = this.createServer()
  }

  listen(name, port = this.app.config.port) {
    tools.log.info('Sirloin %s listening on port %d', name, port)
    this.server.listen(port)
  }

  createServer() {
    return http.createServer(this.request.bind(this))
  }
}

module.exports = Base