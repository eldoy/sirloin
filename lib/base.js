const http = require('http')
const https = require('https')

class Base {
  constructor(app) {
    this.app = app
    this.routes = {}
    this.server = this.createServer()
    this.listen()
  }

  createServer() {
    const opt = [this.request.bind(this), this.agent]
    this.ssl && opt.unshift(this.ssl)
    return this.client.createServer(...opt)
  }

  listen(port = this.app.config.port) {
    this.app.log.info('Sirloin listening on port %d', port)
    this.server.listen(port)
  }

  get client() {
    return this.ssl ? https : http
  }

  get ssl() {
    return this.app.config.ssl
  }

  get agent() {
    return new this.client['Agent']({ keepAlive: true })
  }
}

module.exports = Base
