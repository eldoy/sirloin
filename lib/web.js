const http = require('http')
const https = require('https')
const bodyParser = require('bparse')
const serveStatic = require('hangersteak')
const cookie = require('wcookie')
const core = require('./core')
const log = require('./log')

class Web {
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
    log.info('Web server is listening on port %d', port)
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

  async request(req, res) {
    core.initRequestResponse(req, res)
    const host = this.app.config.host
    if (host && host !== `${req.protocol}//${req.host}${req.path}`) {
      res.setHeader('location', host)
      res.statusCode = 301
      res.end()
    } else {
      cookie(req)
      let data = await this.runMiddleware(req, res)
      if (typeof data === 'undefined') {
        data = await this.processRoute(req, res)
      }
      if (typeof data === 'undefined') {
        const { files } = this.app.config
        typeof files === 'string'
          ? serveStatic(req, res, { dir: files })
          : core.send(req, res)
      } else {
        core.send(req, res, data)
      }
    }
  }

  async runMiddleware(req, res) {
    for (const fn of this.app.middleware) {
      const data = await this.app.run('http', fn, req, res)
      if (typeof data !== 'undefined') {
        return data
      }
    }
  }

  async processRoute(req, res) {
    if (req.method === 'OPTIONS') {
      return ''
    }
    const routes = this.routes[req.method]
    if (routes) {
      const route = routes[req.pathname] || routes['*']
      if (route) {
        if (req.method !== 'GET') {
          await bodyParser(req)
        }
        const result = await this.app.run('http', route, req, res)
        if (typeof result !== 'undefined') {
          return result
        }
      }
    }
  }
}

module.exports = Web
