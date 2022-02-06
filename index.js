const { v4: uuid } = require('uuid')
const ws = require('ws')
const rekvest = require('rekvest')
const setup = require('./lib/setup.js')
const run = require('./lib/run.js')
const server = require('./lib/server.js')
const socket = require('./lib/socket.js')
const sub = require('./lib/sub.js')
const core = require('./lib/core.js')
const log = require('./lib/log.js')

module.exports = function(config = {}) {

  // Internal state
  const state = {
    // Init HTTP routes
    routes: {},

    // Middleware functions
    middleware: [],

    // Websocket actions
    actions: {},

    // Custom handler functions
    handlers: {}
  }

  // Add defaults and set up config
  setup(config)

  // Set up web server
  const http = server(state, config)

  // Set up web socket
  const websocket = socket(http, publish, state, config)

  // Set up pub sub
  const pubsub = sub(websocket, state, config)

  // Publish to pubsub channel
  function publish(name, data, options = {}, fn, client) {
    if (typeof options == 'function') {
      fn = options
      options = {}
    }
    if (client) {
      options.clientid = client.id
    }
    return new Promise(resolve => {
      if (typeof fn == 'undefined') {
        fn = () => resolve()
      }
      if (typeof fn == 'function') {
        options.cbid = uuid()
        pubsub.callbacks[options.cbid] = fn
      }
      if (pubsub.connected) {
        const msg = JSON.stringify({ name, data, options })
        pubsub.publisher.publish(config.pubsub.channel, msg)
      }
    })
  }

  // Public functions and properties
  const api = core(state)

  api.http = http
  api.websocket = websocket
  api.publish = publish
  api.pubsub = pubsub
  api.config = config

  return api
}
