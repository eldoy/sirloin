const Http = require('./lib/http')
const Websocket = require('./lib/websocket')
const tools = require('./lib/tools')

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const APIS = ['error', 'fail']
const PORT = 3000
const FILES = 'dist'

class Sirloin {
  constructor (config = {}) {
    this.middleware = []
    this.api = {}
    this.configure(config)
    this.http = new Http(this)
    this.initRoutes()
    this.initApi()
  }

  configure (config) {
    if (!config.port) {
      config.port = PORT
    }
    if (config.pubsub === true) {
      config.pubsub = {}
    }
    switch(typeof config.files) {
      case 'undefined': config.files = FILES
      case 'string':
      if(!tools.fileExists(config.files)) {
        config.files = false
      }
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

  initApi () {
    for (const a of APIS) {
      this[a] = (fn) => { this.api[a] = fn }
    }
  }

  subscribe (name, fn) {
    if (APIS.includes(name)) {
      throw new Error(`Invalid name for subscribe: ${name}`)
    }
    this.api[name] = fn
  }

  publish (...args) {
    return this.websocket.publish(...args)
  }

  get log () {
    return tools.log
  }

  use (fn) {
    this.middleware.push(fn)
  }

  async run (type, fn, ...args) {
    try {
      return await fn(...args)
    } catch (err) {
      const e = this.api[type === 'websocket' ? 'fail' : 'error']
      if (e) {
        return await e(err, ...args)
      } else {
        throw err
      }
    }
  }

  any (...args) {
    const [fn, path, ...methods] = args.reverse()
    this.all(path, fn, methods)
  }

  all (path, fn, methods = METHODS) {
    for (const m of methods) {
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
