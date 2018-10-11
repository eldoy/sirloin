const mime = require('mime-types')
const fs = require('fs')
const path = require('path')

path.extname('index.html')

class Files {
  constructor (app) {
    this.app = app
  }

  processStatic (req, res) {
    if (!this.app.options.static) {
      return
    }
    let name = `${this.app.options.static}/${req.pathname}`
    if (name.slice(-1) === '/') {
      name += 'index.html'
    }
    if (fs.existsSync(name)) {
      const file = fs.readFileSync(name, 'utf8')
      const ext = path.extname(name)
      const type = mime.contentType(ext) || 'text/plain; charset: utf-8'
      res.setHeader('Content-Type', type)
      return file
    }
  }
}

module.exports = Files