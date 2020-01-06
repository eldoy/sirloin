const url = require('url')
const fs = require('fs')
const log = require('./log')

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Content-Type': 'application/json; charset=utf-8'
}

class Core {
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
    let host = req.headers['x-forwarded-host']
    if (!host) {
      host = req.headers['host']
    }
    let proto = req.headers['x-forwarded-proto']
    if (!proto) {
      proto = req.socket.encrypted ? 'https' : 'http'
    }
    const uri = this.parseUri(`${proto}://${host}${req.url}`)
    for (const key in uri) {
      req[key] = uri[key]
    }
    req.ip = req.socket.remoteAddress
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

  send(req, res, data) {
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

  /******
  * File functions
  */

  fileExists(name) {
    return fs.existsSync(name)
  }

  readFile(name) {
    return fs.readFileSync(name, 'utf8')
  }
}

module.exports = new Core()
