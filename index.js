const Http = require('./lib/http')
const Websocket = require('./lib/websocket')

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const DEFAULT_PORT = 3000
const STATIC_DIR = 'dist'

class Sirloin {
  constructor (config = {}) {
    this.middleware = []
    this.configure(config)
    this.http = new Http(this)
    this.initRoutes()
    this.websocket = new Websocket(this)
  }

  configure (config) {
    if (!config.port) {
      config.port = DEFAULT_PORT
    }
    if (config.static !== false) {
      config.static = STATIC_DIR
    }
    this.config = config
  }

  initRoutes () {
    for (const m of METHODS) {
      this.http.routes[m] = {}
      this[m.toLowerCase()] = (path, fn) => {
        this.http.routes[m][path] = fn
      }
    }
  }

  use (fn) {
    this.middleware.push(fn)
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

module.exports = Sirloin
