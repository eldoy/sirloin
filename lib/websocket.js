const { v4: uuid } = require('uuid')
const ws = require('ws')
const rekvest = require('rekvest')
const pubsub = require('./pubsub.js')

const TIMEOUT = 30000
const CBID = '$cbid'
const ACTIONID = '$action'

function normalizeArgs(options, fn) {
  switch (typeof options) {
    case 'function': fn = options; options = {}
    case 'undefined': options = {}
  }
  return { options, fn }
}

class Websocket {
  constructor(app) {
    this.app = app
    this.actions = {}
    this.callbacks = {}

    this.server = new ws.Server({ server: app.http.server })
    this.server.on('connection', async (client, req) => {
      rekvest(req)
      client.req = req
      client.isAlive = true
      client.id = uuid()
      client.websocket = this

      // Modify client
      client.deliver = client.send
      client.send = (data, _options, _fn) => {
        const { options, fn } = normalizeArgs(_options, _fn)
        return new Promise(resolve => {
          if (typeof data === 'object') {
            data = JSON.stringify(data)
          }
          client.deliver(data, options, () => fn ? fn() : resolve())
        })
      }
      client.publish = function(name, data, options, fn) {
        return this.websocket.publish(name, data, options, fn, this)
      }
      if (this.app.config.connect) {
        await this.app.config.connect(client)
      }
      client.on('pong', () => client.isAlive = true)
      client.on('close', () => client.isAlive = false)
      client.on('message', async (data) => {
        data = JSON.parse(data)
        const id = data[CBID]
        delete data[CBID]
        const name = data[ACTIONID] || '*'
        const action = this.actions[name]
        delete data[ACTIONID]
        // console.log('ACTION %s\n%s\n', name, JSON.stringify(data))

        if (action) {
          const result = await this.app.run('websocket', action, data, client)
          if (typeof result !== 'undefined') {
            if (id) {
              result[CBID] = id
            }
            client.send(result)
          }
        }
      })
    })

    this.interval = setInterval(() => {
      this.server.clients.forEach(client => {
        if (client.isAlive === false) {
          return client.terminate()
        }
        client.isAlive = false
        client.ping('', false, true)
      })
    }, TIMEOUT)

    if (app.config.pubsub) {
      this.pubsub = pubsub(app, this)
    }
  }

  publish(name, data, _options, _fn, client) {
    let { options, fn } = normalizeArgs(_options, _fn)
    return new Promise(resolve => {
      if (client) {
        options.clientid = client.id
      }
      switch (typeof fn) {
        case 'undefined': fn = () => resolve()
        case 'function':
          options.cbid = uuid()
          this.callbacks[options.cbid] = fn
      }
      this.pubsub(name, data, options)
    })
  }
}

module.exports = Websocket
