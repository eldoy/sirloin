const url = require('url')
const fs = require('fs')
const Rainlog = require('rainlog')

class Tools {
  constructor () {
    this.log = new Rainlog()
  }

  /******
  * General tools
  */

  setRequestProperties (req) {
    const uri = url.parse(req.url, true)
    for (const key in uri) {
      req[key] = uri[key]
    }
  }

  normalize (options, fn) {
    switch (typeof options) {
      case 'function': fn = options; options = {}
      case 'undefined': options = {}
    }
    return { options, fn }
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