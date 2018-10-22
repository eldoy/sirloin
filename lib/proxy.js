const http = require('http')
const httpProxy = require('http-proxy')
const tools = require('./tools')

class Proxy {
  constructor (app) {
    this.app = app
    this.routes = {}
    this.upgrade = this.upgrade.bind(this)
    this.request = this.request.bind(this)
    this.createServer()
    this.listen()
  }

  createServer () {
    this.server = http.createServer(this.request)
    this.server.on('upgrade', this.upgrade)
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
    if (proxy) {
      proxy.web(req, res)
    }
  }

  getProxy (req, protocol) {
    tools.setRequestProperties(req)
    let proxy = this.routes[`${protocol}:${req.pathname}`]
    if (!proxy) {
      proxy = this.routes[`${protocol}:*`]
    }
    return proxy
  }

  add (path, host) {
    if (typeof host === 'undefined') {
      host = path; path = '*'
    }
    const uri = tools.parse(host)
    const target = { host: uri.hostname, port: uri.port }
    const agent = new http.Agent({ keepAlive: true })
    const proxy = httpProxy.createProxyServer({ target, agent })
    this.routes[`${uri.protocol}${path}`] = proxy
  }
}

module.exports = Proxy