const util = require('util')

function inspect(obj) {
  return util.inspect(obj, { showHidden: true, depth: null, colors: true })
}

module.exports = function(message, data = {}) {
  if (process.env.NODE_ENV != 'production') {
    console.log(`\n${message}\n${inspect(data)}`)
  }
}
