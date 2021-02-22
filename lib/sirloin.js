const fs = require('fs')
const Web = require('./web')
const Websocket = require('./websocket')

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const APIS = ['error', 'fail']
const PORT = 3000
const FILES = 'dist'

class Sirloin {
  constructor(config = {}) {
    this.middleware = []
    this.api = {}
    config.port = config.port || PORT
    if (config.pubsub === true) config.pubsub = {}
    switch(typeof config.files) {
      case 'undefined': config.files = FILES
      case 'string':
        if(!fs.existsSync(config.files)) {
          config.files = false
        }
    }
    if (config.ssl) {
      config.ssl.key = fs.readFileSync(config.ssl.key, 'utf8')
      config.ssl.cert = fs.readFileSync(config.ssl.cert, 'utf8')
    }
    this.config = config
    this.http = new Web(this)

    // Init routes
    for (const m of METHODS) {
      this.http.routes[m] = {}
      this[m.toLowerCase()] = (path, fn) => {
        this.http.routes[m][path] = fn
      }
    }

    // Init APIs
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
    const [fn, path] = args.reverse()
    this.all(path, fn)
  }

  all(path, fn, methods = METHODS) {
    for (const m of methods) {
      this[m.toLowerCase()](path, fn)
    }
  }

  action(name, fn) {
    if (!this.websocket) {
      this.websocket = new Websocket(this)
    }
    this.websocket.actions[name] = fn
  }
}

module.exports = Sirloin
