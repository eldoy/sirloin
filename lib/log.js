const util = require('util')

module.exports = function log(msg, data = {}) {
  if (process.env.NODE_ENV != 'production') {
    console.log(`\n${msg}\n${util.inspect(data)}`)
  }
}
