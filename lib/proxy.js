const http = require('http')
const httpProxy = require('http-proxy')
const tools = require('./tools')

class Proxy {
  constructor (app) {
    this.app = app
    this.routes = {}
    this.createServer()
    this.listen()
  }

  createServer () {
    this.server = http.createServer(this.request.bind(this))
    this.server.on('upgrade', this.upgrade.bind(this))
  }

  listen (port = this.app.config.port) {
    tools.log.info('Sirloin proxy listening on port %d', port)
    this.server.listen(port)
  }

  upgrade (req, socket, head) {
    const proxy = this.getProxy(req, 'ws')
    if (proxy) {
      proxy.ws(req, socket, head)
    }
  }

  request (req, res) {
    const proxy = this.getProxy(req, 'http')
    proxy ? proxy.web(req, res) : this.empty(res)
  }

  empty (res) {
    tools.setResponseHeaders(res)
    const data = tools.notFound(res)
    res.end(JSON.stringify(data))
  }

  getProxy (req, protocol) {
    tools.setRequestProperties(req)
    return this.routes[`${protocol}:${req.pathname}`] ||
      this.routes[`${protocol}:*`]
  }

  add (path, host) {
    if (typeof host === 'undefined') {
      host = path; path = '*'
    }
    const uri = tools.parseUri(host)
    const target = { host: uri.hostname, port: uri.port }
    const agent = new http.Agent({ keepAlive: true })
    const proxy = httpProxy.createProxyServer({ target, agent })
    this.routes[`${uri.protocol}${path}`] = proxy
  }
}

module.exports = Proxy