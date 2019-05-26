const Web = require('./web')
const Proxy = require('./proxy')
const Websocket = require('./websocket')
const framework = require('./framework')
const log = require('./log')

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const APIS = ['error', 'fail']
const PORT = 3000
const FILES = 'dist'

class Sirloin {
  constructor(config = {}) {
    this.middleware = []
    this.api = {}
    this.log = log
    this.config = this.configure(config)
    if (this.config.proxy) {
      this.http = new Proxy(this)
    } else {
      this.http = new Web(this)
      this.initRoutes()
      this.initApi()
    }
  }

  configure(config) {
    config.port = config.port || PORT
    if (config.pubsub === true) { config.pubsub = {} }
    switch(typeof config.files) {
      case 'undefined': config.files = FILES
      case 'string':
        if(!framework.fileExists(config.files)) {
          config.files = false
        }
    }
    if (config.ssl) {
      config.ssl.key = framework.readFile(config.ssl.key)
      config.ssl.cert = framework.readFile(config.ssl.cert)
    }
    return config
  }

  initRoutes() {
    for (const m of METHODS) {
      this.http.routes[m] = {}
      this[m.toLowerCase()] = (path, fn) => {
        this.http.routes[m][path] = fn
      }
    }
  }

  initApi() {
    for (const a of APIS) {
      this[a] = fn => this.api[a] = fn
    }
  }

  subscribe(name, fn) {
    if (APIS.includes(name)) {
      throw new Error(`Invalid name for subscribe: ${name}`)
    }
    this.api[name] = fn
  }

  publish(...args) {
    return this.websocket.publish(...args)
  }

  use(fn) {
    this.middleware.push(fn)
  }

  async run(type, fn, ...args) {
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

  any(...args) {
    const [fn, path, ...framework] = args.reverse()
    this.all(path, fn, framework)
  }

  all(path, fn, framework = METHODS) {
    for (const m of framework) {
      this[m.toLowerCase()](path, fn)
    }
  }

  action(name, fn) {
    if (!this.websocket) {
      this.websocket = new Websocket(this)
    }
    this.websocket.actions[name] = fn
  }

  proxy(path, host, fn) {
    this.http.createProxy(path, host, fn)
  }
}

module.exports = Sirloin
