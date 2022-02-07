const setup = require('./lib/setup.js')
const http = require('./lib/http.js')
const websocket = require('./lib/websocket.js')
const pubsub = require('./lib/pubsub.js')
const api = require('./lib/api.js')

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

  // Set up http server
  app.http = http(state, config)

  // Set up websocket
  app.websocket = websocket(app, state, config)

  // Set up pubsub
  app.pubsub = pubsub(app, state, config)

  // Public functions and properties
  return {
    config,
    ...app,
    ...api(state)
  }
}
