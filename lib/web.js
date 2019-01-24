const bodyparser = require('bparse')
const Base = require('./base')
const Message = require('./message')
const Files = require('./files')

class Web extends Base {
  constructor(app) {
    super(app)
    this.files = new Files(app)
  }

  async request(req, res) {
    const message = new Message(this.app, req, res)
    let data = await this.runMiddleware(req, res)
    if (typeof data === 'undefined') {
      data = await this.processRoute(req, res)
    }
    if (typeof data === 'undefined') {
      data = this.files.processStatic(req, res)
    }
    message.send(data)
  }

  async runMiddleware(req, res) {
    for (const fn of this.app.middleware) {
      const data = await this.app.run('http', fn, req, res)
      if (typeof data !== 'undefined') {
        return data
      }
    }
  }

  async processRoute(req, res) {
    if (req.method === 'OPTIONS') {
      return ''
    }
    const routes = this.routes[req.method]
    if (routes) {
      const route = routes[req.pathname] || routes['*']
      if (route) {
        if (req.method !== 'GET') {
          await bodyparser(req)
        }
        const result = await this.app.run('http', route, req, res)
        if (typeof result !== 'undefined') {
          return result
        }
      }
    }
  }
}

module.exports = Web
