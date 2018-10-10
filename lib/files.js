const mime = require('mime-types')
const fs = require('fs')

class Files {
  constructor (app) {
    this.app = app
  }

  processStatic (req, res) {
    if (!this.app.options.static) {
      return
    }
    let path = `${this.app.options.static}/${req.path}`
    if (path.slice(-1) === '/') {
      path += 'index.html'
    }
    if (fs.existsSync(path)) {
      const file = fs.readFileSync(path, 'utf8')
      const type = mime.lookup(path) || 'text/plain'
      res.setHeader('Content-Type', type)
      return file
    }
  }
}

module.exports = Files