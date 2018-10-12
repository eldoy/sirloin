const Http = require('./lib/http')
const Websocket = require('./lib/websocket')
const tools = require('./lib/tools')

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const DEFAULT_PORT = 3000
const FILE_DIR = 'dist'

class Sirloin {
  constructor (config = {}) {
    this.middleware = []
    this.configure(config)
    this.http = new Http(this)
    this.initRoutes()
  }

  configure (config) {
    if (!config.port) {
      config.port = DEFAULT_PORT
    }
    if (config.files !== false) {
      if (typeof config.files === 'undefined') {
        config.files = FILE_DIR
      }
      if (!tools.fileExists(config.files)) {
        config.files = false
      }
    }
    if (config.pubsub === true) {
      config.pubsub = {}
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

  async run (type, fn, ...args) {
    try {
      return await fn(...args)
    } catch (err) {
      const e = type === 'websocket' ? this.fail : this.error
      if (e) {
        return await e(err, ...args)
      } else {
        throw err
      }
    }
  }

  error (fn) {
    this.error = fn
  }

  fail (fn) {
    this.fail = fn
  }

  any (path, fn) {
    for (const m of METHODS) {
      this[m.toLowerCase()](path, fn)
    }
  }

  action (name, fn) {
    if (!this.websocket) {
      this.websocket = new Websocket(this)
    }
    this.websocket.actions[name] = fn
  }
}

module.exports = Sirloin
