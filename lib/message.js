const tools = require('./tools')

HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Content-Type': 'application/json; charset=utf-8'
}

class Message {
  constructor(req, res) {
    this.req = req
    this.res = res

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

  notFound() {
    this.res.statusCode = 404
    return {}
  }

  send(data) {
    switch (typeof data) {
      case 'undefined': data = this.notFound()
      case 'object': data = JSON.stringify(data)
      default: data = String(data)
    }
    this.res.setHeader('Content-Length', Buffer.byteLength(data))
    this.res.end(data)
  }
}

module.exports = Message
