const url = require('url')
const fs = require('fs')
const Rainlog = require('rainlog')

class Tools {
  constructor() {
    this.log = new Rainlog()
  }

  /******
  * Data functions
  */

  parseUri(uri) {
    return url.parse(uri, true)
  }

  normalizeArgs(options, fn) {
    switch (typeof options) {
      case 'function': fn = options; options = {}
      case 'undefined': options = {}
    }
    return { options, fn }
  }

  /******
  * Request & response functions
  */

  setupRequest(req, res) {
    if (res) {
      this.setResponseHeaders(res)
    }
    this.setRequestProperties(req)
    this.printRequest(req)
  }

  setResponseHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
  }

  setRequestProperties(req) {
    const uri = this.parseUri(req.url)
    for (const key in uri) {
      req[key] = uri[key]
    }
  }

  printRequest(req) {
    this.log.info('%s %s\n%o\n', req.method, req.path, req.query)
  }

  notFound(res) {
    res.statusCode = 404
    return {}
  }

  send(res, data) {
    switch (typeof data) {
      case 'undefined': data = this.notFound(res)
      case 'object': data = JSON.stringify(data)
      default: data = String(data)
    }
    res.setHeader('Content-Length', Buffer.byteLength(data))
    res.end(data)
  }


  /******
  * File tools
  */

  fileExists(name) {
    return fs.existsSync(name)
  }

  readFile(name) {
    return fs.readFileSync(name, 'utf8')
  }

  mtime(name) {
    return fs.statSync(name).mtime
  }
}

module.exports = new Tools()
