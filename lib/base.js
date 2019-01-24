const http = require('http')
const tools = require('./tools')

class Base {
  constructor(app) {
    this.app = app
    this.routes = {}
    this.server = this.createServer()
    this.listen()
  }

  createServer() {
    return http.createServer(this.request.bind(this))
  }

  listen(port = this.app.config.port) {
    tools.log.info('Sirloin listening on port %d', port)
    this.server.listen(port)
  }
}

module.exports = Base
