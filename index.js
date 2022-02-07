const setup = require('./lib/setup.js')
const run = require('./lib/run.js')
const server = require('./lib/server.js')
const socket = require('./lib/socket.js')
const broker = require('./lib/broker.js')
const api = require('./lib/api.js')
const log = require('./lib/log.js')

module.exports = function(config = {}) {

  var state = {
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

  const app = {}

  // Set up web server
  app.http = server(state, config)

  // Set up websocket
  app.websocket = socket(app, state, config)

  // Set up pubsub
  app.pubsub = broker(app, state, config)

  // Public functions and properties
  return {
    config,
    ...app,
    ...api(state)
  }
}
