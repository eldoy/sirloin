const { v4: uuid } = require('uuid')
const ws = require('ws')
const rekvest = require('rekvest')

const setup = require('./lib/setup.js')
const run = require('./lib/run.js')
const server = require('./lib/server.js')
const socket = require('./lib/socket.js')
const sub = require('./lib/sub.js')

const log = require('./lib/log.js')

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']


module.exports = function(config = {}) {

  // Public api functions and properties
  const api = {}

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
  // TODO: Move publish earlier, or move setup here
  const websocket = socket(http, state, config, publish)

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


  /***************************************************************
  /* API
  ***************************************************************/

  // Generate verb functions
  for (const m of METHODS) {
    state.routes[m] = {}
    api[m.toLowerCase()] = function(path, fn) {
      state.routes[m][path] = fn
    }
  }

  // Match specific methods
  api.all = function(path, fn, methods = METHODS) {
    for (const m of methods) {
      api[m.toLowerCase()](path, fn)
    }
  }

  // Match any method
  api.any = function(...args) {
    const [fn, path] = args.reverse()
    api.all(path, fn)
  }

  // Use middleware
  api.use = function(fn) {
    state.middleware.push(fn)
  }

  // Match action name
  api.action = function(name, fn) {
    state.actions[name] = fn
  }

  // Subscribe to publish
  api.subscribe = function(name, fn) {
    state.handlers[name] = fn
  }

  // HTTP error
  api.error = function(fn) {
    state.handlers.error = fn
  }

  // Websocket fail
  api.fail = function(fn) {
    state.handlers.fail = fn
  }

  // Public functions and properties
  api.http = http
  api.websocket = websocket
  api.publish = publish
  api.config = config

  return api
}
