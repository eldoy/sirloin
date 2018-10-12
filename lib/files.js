const mime = require('mime-types')
const tools = require('./tools')

class Files {
  constructor (app) {
    this.app = app
  }

  processStatic (req, res) {
    if (!this.app.config.files) {
      return
    }
    const name = this.getName(req)
    if (tools.fileExists(name)) {
      res.setHeader('Content-Type', this.contentType(name))
      return tools.readFile(name)
    }
  }

  getName (req) {
    let name = `${this.app.config.files}${req.pathname}`
    if (name.slice(-1) === '/') {
      name += 'index.html'
    }
    return name
  }

  contentType (name) {
    const entry = mime.lookup(name) || 'text/plain'
    return mime.contentType(entry)
  }
}

module.exports = Files