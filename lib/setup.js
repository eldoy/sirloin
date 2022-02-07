const fs = require('fs')
const path = require('path')

module.exports = function(config) {
  if (typeof config.port == 'undefined') {
    config.port = 3000
  }

  if (typeof config.dir == 'undefined') {
    config.dir = 'dist'
  }

  if (typeof config.dir == 'string' && !fs.existsSync(config.dir)) {
    config.dir = false
  }

  if (config.ssl) {
    function read(name) {
      let file = path.join(process.cwd(), config.ssl[name])
      return fs.readFileSync(file, 'utf8')
    }
    config.ssl.key = read('key')
    config.ssl.cert = read('cert')
  }

  if (config.pubsub === true) {
    config.pubsub = {}
  }
}
