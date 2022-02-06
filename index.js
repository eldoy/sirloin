const Redis = require('ioredis')

const { v4: uuid } = require('uuid')
const ws = require('ws')
const rekvest = require('rekvest')

const configure = require('./lib/configure.js')
const run = require('./lib/run.js')
const server = require('./lib/server.js')

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
  configure(config)

  // Set up web server
  const http = server(state, config)


  /***************************************************************
  * WEBSOCKET
  ***************************************************************/

  // Set up web socket
  const websocket = new ws.Server({ server: http })

  // The websocket callback
  async function websocketRequest(client, req) {
    rekvest(req)

    // Additional properties
    client.req = req
    client.isAlive = true
    client.id = uuid()

    // Support promises and JSON for client send
    client.deliver = client.send

    client.send = function(data, options = {}, fn) {
      if (typeof options == 'function') {
        fn = options
        options = {}
      }
      if (typeof data == 'object') {
        data = JSON.stringify(data)
      }
      return new Promise(resolve => {
        client.deliver(data, options, () => fn ? fn() : resolve())
      })
    }

    client.publish = function(name, data, options, fn) {
      return publish(name, data, options, fn, client)
    }

    // Run websocket connect callback
    if (typeof config.connect == 'function') {
      await config.connect(client)
    }

    client.on('pong', () => client.isAlive = true)
    client.on('close', () => client.isAlive = false)

    async function webSocketMessage(data) {
      // Extract data and action
      data = JSON.parse(data)
      const name = data.$action || '*'
      const action = state.actions[name]
      delete data.$action

      // Log request
      log(`WS /${name}`, data)

      // Run action and send result
      if (action) {
        const result = await run(action, state.handlers.fail, data, client)
        if (typeof result != 'undefined') {
          client.send(result)
        }
      }
    }
    client.on('message', webSocketMessage)
  }

  websocket.on('connection', websocketRequest)

  // Terminate stale clients
  function terminateStaleClients() {
    websocket.clients.forEach(client => {
      if (client.isAlive === false) {
        return client.terminate()
      }
      client.isAlive = false
      client.ping(function(){})
    })
  }

  setInterval(terminateStaleClients, 30000)


  /***************************************************************
  /* PUBSUB
  ***************************************************************/

  // The name of the pubsub channel
  let channel

  // The pubsub publisher
  let publisher

  // The pubsub receiver
  let receiver

  // Whether or not we are connected to pubsub
  let connected

  // Holds pubsub callbacks
  const callbacks = {}

  if (config.pubsub) {
    if (!channel) {
      channel = 'messages'
    }

    // Channel to send on
    publisher = new Redis(config.pubsub)

    // Receiver is the channel to receive on
    receiver = new Redis(config.pubsub)

    receiver.subscribe(channel, subscribeChannel)
    receiver.on('message', pubsubMessage)
  }

  // Subscribe to config channel name
  function subscribeChannel(err) {
    if (err) {
      console.log(`Pubsub channel '${channel}' is unavailable`)
      console.log(err.message)
      throw err
    } else {
      console.log(`Pubsub subscribed to channel '${channel}'`)
      connected = true
    }
  }

  // Receive messages here from publish
  async function pubsubMessage(channel, msg) {
    const { name, data, options } = JSON.parse(msg)
    const { clientid, cbid } = options
    const client = [...websocket.clients].find(c => c.id == clientid)
    const callback = callbacks[cbid]
    delete callbacks[cbid]
    await state.handlers[name](data, client)
    if (callback) callback()
  }

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
        callbacks[options.cbid] = fn
      }
      if (connected) {
        const msg = JSON.stringify({ name, data, options })
        publisher.publish(channel, msg)
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
