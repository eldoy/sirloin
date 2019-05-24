const bodyparser = require('bparse')
const Hangersteak = require('hangersteak')
const Base = require('./base')
const Message = require('./message')
const tools = require('./tools')

class Web extends Base {
  constructor(app) {
    super(app)
  }

  async request(req, res) {
    const message = new Message(req, res)
    let data = await this.runMiddleware(req, res)
    if (typeof data === 'undefined') {
      data = await this.processRoute(req, res)
    }
    if (typeof data !== 'undefined') {
      tools.send(res, data)
    } else {
      new Hangersteak(req, res, { dir: this.app.config.files })
    }
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
