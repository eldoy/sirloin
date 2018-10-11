const mime = require('mime-types')
const fs = require('fs')

class Files {
  constructor (app) {
    this.app = app
  }

  processStatic (req, res) {
    if (!this.app.config.files) {
      return
    }
    let name = `${this.app.config.files}${req.pathname}`
    if (name.slice(-1) === '/') {
      name += 'index.html'
    }
    if (fs.existsSync(name)) {
      const file = fs.readFileSync(name, 'utf8')
      const entry = mime.lookup(name) || 'text/plain'
      const type = mime.contentType(entry)
      res.setHeader('Content-Type', type)
      return file
    }
  }
}

module.exports = Files