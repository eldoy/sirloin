const http = require('http')
const https = require('https')
const log = require('./log')

class Base {
  constructor(app) {
    this.app = app
    this.routes = {}
    this.server = this.createServer()
    this.listen()
  }

  createServer() {
    const serverOptions = [this.ssl, this.request.bind(this), this.agent]
    return this.client.createServer(...serverOptions)
  }

  listen(port = this.app.config.port) {
    this.server.listen(port)
    log.info('Sirloin listening on port %d', port)
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