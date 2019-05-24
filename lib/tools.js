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
