const url = require('url')
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

module.exports = tools