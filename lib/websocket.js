const uuid = require('uuid/v4')
const ws = require('ws')
const Pubsub = require('./pubsub')
const tools = require('./tools')

const TIMEOUT = 30000
const ID = '$__cbid__'

class Websocket {
  constructor (app) {
    this.app = app
    this.actions = {}
    this.server = new ws.Server({ server: app.http.server })
    this.connection = this.connection.bind(this)
    this.server.on('connection', this.connection)
    this.ping = this.ping.bind(this)
    this.interval = setInterval(this.ping, TIMEOUT)
    if (app.config.pubsub) {
      this.pubsub = new Pubsub(this)
    }
  }

  async connection (client, req) {
    tools.setRequestProperties(req)
    client.req = req
    client.isAlive = true
    client.id = uuid()
    client.websocket = this
    client.callbacks = {}
    this.modify(client)

    if (this.app.config.connect) {
      await this.app.config.connect(client)
    }

    client.on('pong', () => {
      client.isAlive = true
    })

    client.on('close', () => {
      client.isAlive = false
    })

    client.on('message', (data) => {
      this.message(data, client)
    })
  }

  modify (client) {
    client.deliver = client.send
    client.send = function (data, o, f) {
      const { options, fn } = tools.normalizeArgs(o, f)
      return new Promise((resolve) => {
        if (typeof data === 'object') {
          data = JSON.stringify(data)
        }
        this.deliver(data, options, () => fn ? fn() : resolve())
      })
    }

    client.publish = function (name, data, o, f) {
      let { options, fn } = tools.normalizeArgs(o, f)
      return new Promise((resolve) => {
        if (this.id) {
          options.id = this.id
        }
        switch (typeof fn) {
          case 'undefined': fn = () => { resolve() }
          case 'function':
          options.fn = uuid()
          this.callbacks[options.fn] = fn
        }
        this.websocket.pubsub.publish(name, data, options)
      })
    }
  }

  parse (data) {
    const id = data[ID]
    delete data[ID]
    const name = data.action || '*'
    const action = this.actions[name]
    delete data.action
    return { id, action, name }
  }

  async message (data, client) {
    data = JSON.parse(data)
    const { id, action, name } = this.parse(data)
    this.printAction(data, name)
    if (action) {
      const result = await this.app.run('websocket', action, data, client)
      if (typeof result !== 'undefined') {
        if (id) {
          result[ID] = id
        }
        client.send(result)
      }
    }
  }

  printAction (data, name) {
    tools.log.info('ACTION %s\n%o\n', name, data)
  }

  ping () {
    this.server.clients.forEach((client) => {
      if (client.isAlive === false) {
        return client.terminate()
      }
      client.isAlive = false
      client.ping('', false, true)
    })
  }

  get clients () {
    return [...this.server.clients]
  }
}

module.exports = Websocket