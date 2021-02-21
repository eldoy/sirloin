const rekvest = require('rekvest')

const tools = {}

tools.initRequestResponse = function(req, res) {
  rekvest(req)
  if (res) res.setHeader('Content-Type', 'application/json; charset=utf-8')
  console.log('%s %s\n%s\n', req.method, req.path, JSON.stringify(req.query))
}

module.exports = tools
