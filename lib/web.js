const bodyParser = require('bparse')
const serveStatic = require('hangersteak')
const cookie = require('wcookie').node
const Base = require('./base')
const core = require('./core')

class Web extends Base {
  constructor(app) {
    super(app)
  }

  async request(req, res) {
    core.initRequestResponse(req, res)
    cookie(req)
    let data = await this.runMiddleware(req, res)
    if (typeof data === 'undefined') {
      data = await this.processRoute(req, res)
    }
    if (typeof data === 'undefined') {
      const { files } = this.app.config
      typeof files === 'string'
        ? serveStatic(req, res, { dir: files })
        : core.send(req, res)
    } else {
      core.send(req, res, data)
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
          await bodyParser(req)
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
