const http = require('http')
const Http = require('./http')
const ws = require('ws')
const httpProxy = require('http-proxy')
const tools = require('./tools')

class Proxy extends Http {
  constructor (app) {
    super(app)
    this.serverUpgrade()
    this.listen('proxy')
  }

  serverUpgrade () {
    this.server.on('upgrade', this.upgrade.bind(this))
  }

  async upgrade (req, socket, head) {
    tools.setRequestProperties(req)
    const proxy = this.getProxy(req, 'ws')
    if (proxy) {
      const data = await proxy.callback(req)
      if (typeof data === 'undefined') {
        return proxy.ws(req, socket, head)
      }
    }
    socket.destroy()
  }

  async request (req, res) {
    this.initRequest(req, res)
    const proxy = this.getProxy(req, 'http')
    if (proxy) {
      const data = await proxy.callback(req, res)
      return typeof data === 'undefined' ?
        proxy.web(req, res) : this.send(res, data)
    }
    this.send(res)
  }

  getProxy (req, protocol) {
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
}

module.exports = Proxy