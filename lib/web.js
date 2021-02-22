const http = require('http')
const https = require('https')
const bodyParser = require('bparse')
const serveStatic = require('hangersteak')
const cookie = require('wcookie')
const tools = require('./tools')

class Web {
  constructor(app) {
    this.app = app
    this.routes = {}
    const client = app.config.ssl ? https : http
    const serverOptions = [
      app.config.ssl,
      this.request.bind(this),
      new client['Agent']({ keepAlive: true })
    ]
    this.server = client.createServer(...serverOptions)
    const port = app.config.port
    this.server.listen(port)
    console.log('Web server is listening on port %d', port)
  }

  send(req, res, data) {
    switch (typeof data) {
      case 'undefined': res.statusCode = 404
      case 'object': data = JSON.stringify(data || '')
      default: data = String(data)
    }
    if (req.cookieJar && req.cookieJar.length) {
      res.setHeader('set-cookie', req.cookieJar.headers)
    }
    res.setHeader('content-length', Buffer.byteLength(data))
    res.end(data)
  }

  async request(req, res) {
    tools.initRequestResponse(req, res)
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
          : this.send(req, res)
      } else {
        this.send(req, res, data)
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
