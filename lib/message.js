class Message {
  constructor(app, req, res) {
    this.app = app
    this.req = req
    this.res = res
  }

  setupRequest() {
    if (this.res) {
      this.setResponseHeaders()
    }
    this.setRequestProperties()
    this.printRequest()
  }

  setResponseHeaders() {
    this.res.setHeader('Access-Control-Allow-Origin', '*')
    this.res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control')
    this.res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    this.res.setHeader('Content-Type', 'application/json; charset=utf-8')
  }

  setRequestProperties() {
    const uri = this.parseUri(this.req.url)
    for (const key in uri) {
      this.req[key] = uri[key]
    }
  }

  printRequest() {
    this.app.log.info('%s %s\n%o\n', this.req.method, this.req.path, this.req.query)
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