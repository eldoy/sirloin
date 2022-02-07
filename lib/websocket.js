const ws = require('ws')
const rekvest = require('rekvest')

const { v4: uuid } = require('uuid')

const run = require('./run.js')
const log = require('./log.js')

module.exports = function(app, state, config) {

  // Set up web socket
  const websocket = new ws.Server({ server: app.http })

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
      return app.pubsub.publish(name, data, options, fn, client)
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

  return websocket
}
