const http = require('http')
const https = require('https')
const rekvest = require('rekvest')
const bodyParser = require('bparse')
const serveStatic = require('hangersteak')
const cookie = require('wcookie')

class Web {
  constructor(app) {
    this.app = app
    this.routes = {}
    const client = app.config.ssl ? https : http

    this.server = client.createServer(
      app.config.ssl,
      async (req, res) => {
        rekvest(req)
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        cookie(req)
        let data

        // Run middleware
        for (const fn of this.app.middleware) {
          data = await this.app.run('http', fn, req, res)
          if (typeof data !== 'undefined') {
            break
          }
        }

        // Process route
        if (typeof data === 'undefined') {
          if (req.method === 'OPTIONS') {
            data = ''
          }
          const map = this.routes[req.method]
          if (map) {
            const route = map[req.pathname] || map['*']
            if (route) {
              if (req.method !== 'GET') {
                await bodyParser(req)
              }
              data = await this.app.run('http', route, req, res)
            }
          }
        }

        // Serve static if still no match
        const { files } = this.app.config
        if (typeof data === 'undefined' &&
          ['GET', 'HEAD'].includes(req.method) &&
          typeof files === 'string') {
          serveStatic(req, res, { dir: files })
        } else {
          switch (typeof data) {
            case 'undefined': res.statusCode = 404
            case 'object': data = JSON.stringify(data || '')
            default: data = String(data)
          }
          if (req.cookieJar && req.cookieJar.length) {
            res.setHeader('set-cookie', req.cookieJar.headers)
          }
          res.setHeader('content-length', Buffer.byteLength(data))
          res.end(data)
        }
      }
    )

    const port = app.config.port
    this.server.listen(port)
    console.log('Web server is listening on port %d', port)
  }
}

module.exports = Web
