const http = require('http')
const ws = require('ws')
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

  async upgrade (req, socket, head) {
    const proxy = this.getProxy(req, 'ws')
    if (proxy) {
      const data = await proxy.callback(req)
      if (typeof data === 'undefined') {
        proxy.ws(req, socket, head)
      } else {
        socket.destroy()
      }
    } else {
      socket.destroy()
    }
  }

  async request (req, res) {
    const proxy = this.getProxy(req, 'http')
    if (proxy) {
      const data = await proxy.callback(req, res)
      if (typeof data === 'undefined') {
        proxy.web(req, res)
      } else {
        tools.setResponseHeaders(res)
        this.send(res, data)
      }
    } else {
      this.empty(res)
    }
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

  add (path, host, fn) {
    const uri = tools.parseUri(host)
    const target = { host: uri.hostname, port: uri.port }
    const agent = new http.Agent({ keepAlive: true })
    const proxy = httpProxy.createProxyServer({ target, agent })
    proxy.callback = fn || (async () => {})
    this.routes[`${uri.protocol}${path}`] = proxy
  }

  // TODO: Move super class, and notFound as well
  // setResponseHeaders, setRequestProperties
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

module.exports = Proxy