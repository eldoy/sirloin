const url = require('url')
const fs = require('fs')
const tools = {}

tools.setRequestProperties = (req) => {
  const uri = url.parse(req.url, true)
  for (const key in uri) {
    req[key] = uri[key]
  }
}

tools.log = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args)
  }
}

tools.fileExists = (name) => {
  return fs.existsSync(name)
}

tools.readFile = (name) => {
  return fs.readFileSync(name, 'utf8')
}

tools.mtime = (name) => {
  return fs.statSync(name).mtime
}

module.exports = tools