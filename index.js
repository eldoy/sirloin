const Http = require('./lib/http/http')
const Websocket = require('./lib/websocket/websocket')

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const DEFAULT_PORT = 3000
const STATIC_DIR = 'dist'

class FlipFlow {
  constructor (options = {}) {
    this.setOptions(options)
    this.http = new Http(this)
    this.initRoutes()
    this.websocket = new Websocket(this)
  }

  setOptions (options) {
    if (!options.port) {
      options.port = DEFAULT_PORT
    }
    if (options.static !== false) {
      options.static = STATIC_DIR
    }
    this.options = options
  }

  initRoutes () {
    for (const m of METHODS) {
      this.http.routes[m] = {}
      this[m.toLowerCase()] = (path, fn) => {
        this.http.routes[m][path] = fn
      }
    }
  }

  any (path, fn) {
    for (const m of METHODS) {
      this[m.toLowerCase()](path, fn)
    }
  }

  action (name, fn) {
    this.websocket.actions[name] = fn
  }
}

module.exports = FlipFlow