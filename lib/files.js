const mime = require('mime-types')
const Asset = require('./asset')
const tools = require('./tools')

class Files {
  constructor (app) {
    this.app = app
  }

  processStatic (req, res) {
    if (this.refused(req)) {
      return
    }
    const name = this.fileName(req)
    if (tools.fileExists(name)) {
      const asset = new Asset(req, name)
      if (asset.fresh) {
        res.statusCode = 304
        return ''
      }
      res.setHeader('Cache-Control', 'max-age=3600')
      res.setHeader('Last-Modified', asset.lastModified.toUTCString())
      res.setHeader('Content-Type', this.contentType(name))
      return req.method === 'GET' ? tools.readFile(name) : ''
    }
  }

  refused (req) {
    return !this.app.config.files || !['GET', 'HEAD'].includes(req.method)
  }

  fileName (req) {
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