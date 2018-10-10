const url = require('url')
const tools = {}

tools.setRequestProperties = (req) => {
  const uri = url.parse(req.url, true)
  for (const key in uri) {
    req[key] = uri[key]
  }
}

module.exports = tools