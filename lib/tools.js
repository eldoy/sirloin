const url = require('url')
const fs = require('fs')
const Rainlog = require('rainlog')

class Tools {
  constructor () {
    this.log = new Rainlog()
  }

  /******
  * Shared functions
  */

  parseUri (uri) {
    return url.parse(uri, true)
  }

  normalizeArgs (options, fn) {
    switch (typeof options) {
      case 'function': fn = options; options = {}
      case 'undefined': options = {}
    }
    return { options, fn }
  }

  /******
  * Request & response functions
  */

  setRequestProperties (req) {
    const uri = this.parseUri(req.url)
    for (const key in uri) {
      req[key] = uri[key]
    }
  }

  /******
  * File tools
  */

  fileExists (name) {
    return fs.existsSync(name)
  }

  readFile (name) {
    return fs.readFileSync(name, 'utf8')
  }

  mtime (name) {
    return fs.statSync(name).mtime
  }
}

module.exports = new Tools()