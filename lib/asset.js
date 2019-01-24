const tools = require('./tools')

class Asset {
  constructor(req, name) {
    this.modifiedSince = req.headers['if-modified-since']
    this.modifiedDate = new Date(Date.parse(this.modifiedSince))
    this.lastModified = new Date(tools.mtime(name))
  }

  get fresh() {
    return this.modifiedSince && this.modifiedDate >= this.lastModified
  }
}

module.exports = Asset