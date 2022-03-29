const protocols = {
  http: require('http'),
  https: require('https')
}
const bodyParser = require('bparse')
const serveStatic = require('hangersteak')
const cookie = require('wcookie')
const rekvest = require('rekvest')

const run = require('./run.js')
const log = require('./log.js')

module.exports = function(state, config) {

  // Serve data requests
  function serveData(req, res, data) {
    if (req.cookieJar && req.cookieJar.length) {
      res.setHeader('set-cookie', req.cookieJar.headers)
    }
    if (!res.hasHeader('content-type')) {
      res.setHeader('content-type', 'application/json; charset=utf-8')
    }
    if (typeof data == 'undefined') {
      data = ''
      res.statusCode = 404
    }
    if (typeof data == 'object') {
      data = JSON.stringify(data || '')
    }
    data = String(data)
    res.setHeader('content-length', Buffer.byteLength(data))
    res.end(data)
  }

  // The http request callback
  async function httpRequest(req, res) {
    rekvest(req)
    cookie(req)
    let data, isContentRequest = ['GET', 'HEAD'].includes(req.method)

    // Run middleware
    for (const mw of state.middleware) {
      data = await run(mw, state.handlers.error, req, res)
      if (typeof data != 'undefined') break
    }

    // Process route
    if (typeof data == 'undefined') {
      if (req.method == 'OPTIONS') data = ''
      const map = state.routes[req.method]
      if (map) {
        const route = map[req.pathname] || map['*']
        if (route) {
          if (req.method == 'POST') await bodyParser(req)
          data = await run(route, state.handlers.error, req, res)
        }
      }
    }

    // Log request
    if (!isContentRequest) {
      log(`HTTP ${req.pathname}`, req.params)
    }

    // Serve static if still no match
    if (typeof config.dir == 'string' && typeof data == 'undefined' && isContentRequest) {
      serveStatic(req, res, { dir: config.dir })
    } else {
      serveData(req, res, data)
    }
  }

  // Create HTTP server
  const client = protocols[config.ssl ? 'https' : 'http']
  const http = client.createServer(config.ssl, httpRequest)

  // Listen to port
  http.listen(config.port)
  console.log('Web server is listening on port %d', config.port)

  return http
}
