const url = require('url')
const fs = require('fs')

class Tools {
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

  send(res, data) {
    switch (typeof data) {
      case 'undefined': res.statusCode = 404
      case 'object': data = JSON.stringify(data || {})
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
