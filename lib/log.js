const util = require('util')

module.exports = function(message, data = {}) {
  if (process.env.NODE_ENV != 'production') {
    console.log(`\n${message}\n${util.inspect(data)}`)
  }
}
