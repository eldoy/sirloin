const url = require('url')
const fs = require('fs')
const log = require('./log')

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Content-Type': 'application/json; charset=utf-8'
}

class Framework {
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

  initRequestResponse(req, res) {
    this.setRequestProperties(req)
    this.setResponseHeaders(res)
    this.logRequest(req)
  }

  setRequestProperties(req) {
    const uri = this.parseUri(req.url)
    for (const key in uri) {
      req[key] = uri[key]
    }
  }

  setResponseHeaders(res) {
    if (res) {
      for (const key in HEADERS) {
        res.setHeader(key, HEADERS[key])
      }
    }
  }

  logRequest(req) {
    log.info('%s %s\n%s\n', req.method, req.path, JSON.stringify(req.query))
  }

  send(res, data) {
    switch (typeof data) {
      case 'undefined': res.statusCode = 404
      case 'object': data = JSON.stringify(data || {})
      default: data = String(data)
    }
    res.setHeader('content-length', Buffer.byteLength(data))
    res.end(data)
  }

  /******
  * File functions
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

module.exports = new Framework()