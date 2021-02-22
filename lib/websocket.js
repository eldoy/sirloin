const { v4: uuid } = require('uuid')
const ws = require('ws')
const Pubsub = require('./pubsub')
const tools = require('./tools')

const TIMEOUT = 30000
const CBID = '$cbid'
const ACTIONID = '$action'

class Websocket {
  constructor(app) {






    this.app = app
    this.actions = {}
    this.callbacks = {}
    this.server = new ws.Server({ server: app.http.server })
    this.server.on('connection', this.connection.bind(this))
    this.interval = setInterval(this.ping.bind(this), TIMEOUT)
    if (app.config.pubsub) {
      this.pubsub = new Pubsub(app, this)
    }
  }

  async connection(client, req) {
    tools.initRequestResponse(req)
    client.req = req
    client.isAlive = true
    client.id = uuid()
    client.websocket = this
    this.modify(client)
    if (this.app.config.connect) {
      await this.app.config.connect(client)
    }
    client.on('pong', () => client.isAlive = true)
    client.on('close', () => client.isAlive = false)
    client.on('message', data => this.message(data, client))
  }

  modify(client) {
    client.deliver = client.send
    client.send = (data, _options, _fn) => {
      const { options, fn } = tools.normalizeArgs(_options, _fn)
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
  }

  publish(name, data, _options, _fn, client) {
    let { options, fn } = tools.normalizeArgs(_options, _fn)
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
      this.pubsub.publish(name, data, options)
    })
  }

  parse(data) {
    const id = data[CBID]
    delete data[CBID]
    const name = data[ACTIONID] || '*'
    const action = this.actions[name]
    delete data[ACTIONID]
    return { id, action, name }
  }

  async message(data, client) {
    data = JSON.parse(data)
    const { id, action, name } = this.parse(data)
    console.log('ACTION %s\n%s\n', name, JSON.stringify(data))

    if (action) {
      const result = await this.app.run('websocket', action, data, client)
      if (typeof result !== 'undefined') {
        if (id) {
          result[CBID] = id
        }
        client.send(result)
      }
    }
  }

  ping() {
    this.server.clients.forEach(client => {
      if (client.isAlive === false) {
        return client.terminate()
      }
      client.isAlive = false
      client.ping('', false, true)
    })
  }

  getCallback(fn) {
    const cb = this.callbacks[fn]
    delete this.callbacks[fn]
    return cb
  }

  get clients() {
    return [...this.server.clients]
  }
}

module.exports = Websocket
