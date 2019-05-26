const http = require('http')
const httpProxy = require('http-proxy')
const Base = require('./base')
const framework = require('./framework')

class Proxy extends Base {
  constructor(app) {
    super(app)
    this.server.on('upgrade', this.upgrade.bind(this))
  }

  async upgrade(req, socket, head) {
    framework.initRequestResponse(req)
    const proxy = this.getProxy(req, 'ws')
    if (proxy) {
      const data = await proxy.callback(req)
      if (typeof data === 'undefined') {
        return proxy.ws(req, socket, head)
      }
    }
    socket.destroy()
  }

  async request(req, res) {
    framework.initRequestResponse(req, res)
    const proxy = this.getProxy(req, 'http')
    if (proxy) {
      const data = await proxy.callback(req, res)
      return typeof data === 'undefined'
        ? proxy.web(req, res)
        : framework.send(res, data)
    }
    framework.send(res)
  }

  getProxy(req, protocol) {
    return this.routes[`${protocol}:${req.pathname}`] ||
      this.routes[`${protocol}:*`]
  }

  createProxy(path, host, fn) {
    const uri = framework.parseUri(host)
    const target = { host: uri.hostname, port: uri.port }
    const proxy = httpProxy.createProxyServer({ target })
    proxy.callback = fn || (async () => {})
    this.routes[`${uri.protocol}${path}`] = proxy
  }
}

module.exports = Proxy
