const tools = require('./tools')

HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Content-Type': 'application/json; charset=utf-8'
}

class Message {
  constructor(req, res) {
    // Set request properties
    const uri = tools.parseUri(req.url)
    for (const key in uri) {
      req[key] = uri[key]
    }

    // Set response headers
    if (res) {
      for (const key in HEADERS) {
        res.setHeader(key, HEADERS[key])
      }
    }

    // Print request
    console.log('%s %s\n%s\n', req.method, req.path, JSON.stringify(req.query))
  }
}

module.exports = Message
