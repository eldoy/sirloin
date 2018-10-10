const url = require('url')

const tools = {}

tools.setRequestProperties = (req) => {
  const uri = url.parse(req.url, true)
  req.path = uri.path
}

module.exports = tools