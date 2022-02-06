const { v4: uuid } = require('uuid')
const setup = require('./lib/setup.js')
const run = require('./lib/run.js')
const server = require('./lib/server.js')
const socket = require('./lib/socket.js')
const broker = require('./lib/broker.js')
const api = require('./lib/api.js')
const log = require('./lib/log.js')

module.exports = function(config = {}) {

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

  // Set up websocket
  const websocket = socket(http, publish, state, config)

  // Set up pubsub
  const pubsub = broker(websocket, state, config)

  // Publish to pubsub
  function publish(name, data, options = {}, fn, client) {
    if (typeof options == 'function') {
      fn = options; options = {}
    }
    if (client) options.clientid = client.id
    return new Promise(resolve => {
      pubsub.callbacks[options.cbid = uuid()] = fn || resolve
      if (pubsub.connected) {
        const msg = JSON.stringify({ name, data, options })
        pubsub.publisher.publish(config.pubsub.channel, msg)
      }
    })
  }

  // Public functions and properties
  return {
    http,
    websocket,
    publish,
    pubsub,
    config,
    ...api(state)
  }
}
