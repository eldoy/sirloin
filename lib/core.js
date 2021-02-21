const rekvest = require('rekvest')
const fs = require('fs')
const log = require('./log')

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8'
}

class Core {
  /******
  * Data functions
  */

  normalizeArgs(options, fn) {
    switch (typeof options) {
      case 'function': fn = options; options = {}
      case 'undefined': options = {}
    }
    return { options, fn }
  }

  initRequestResponse(req, res) {
    rekvest(req)
    if (res) {
      for (const key in HEADERS) {
        res.setHeader(key, HEADERS[key])
      }
    }
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
}

module.exports = new Core()
