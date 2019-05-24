const tools = require('./tools')

HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Content-Type': 'application/json; charset=utf-8'
}

class Message {
  constructor(app, req, res) {
    this.app = app
    this.req = req
    this.res = res
    this.setResponseHeaders()
    this.setRequestProperties()
    this.printRequest()
  }

  setResponseHeaders() {
    if (this.res) {
      for (const key in HEADERS) {
        this.res.setHeader(key, HEADERS[key])
      }
    }
  }

  setRequestProperties() {
    const uri = tools.parseUri(this.req.url)
    for (const key in uri) {
      this.req[key] = uri[key]
    }
  }

  printRequest() {
    console.log('%s %s\n%s\n', this.req.method, this.req.path, JSON.stringify(this.req.query))
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
