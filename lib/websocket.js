const uuid = require('uuid/v4')
const ws = require('ws')
const tools = require('./tools')

const PING_TIMEOUT = 30000
const ID = '$__cbid__'

class Websocket {
  constructor (app) {
    this.app = app
    this.actions = {}
    this.server = new ws.Server({ server: app.http.server })
    this.connection = this.connection.bind(this)
    this.server.on('connection', this.connection)
    this.ping = this.ping.bind(this)
    this.interval = setInterval(this.ping, PING_TIMEOUT)
  }

  async connection (client, req) {
    tools.setRequestProperties(req)
    this.modify(client)
    client.isAlive = true
    client.id = uuid()

    if (this.app.config.connect) {
      await this.app.config.connect(client, req)
    }

    client.on('pong', () => {
      client.isAlive = true
    })

    client.on('close', () => {
      client.isAlive = false
    })

    client.on('message', (data) => {
      this.message(data, client, req)
    })
  }

  modify (client) {
    client.deliver = client.send
    client.send = function (data) {
      if (typeof data === 'object') {
        data = JSON.stringify(data)
      }
      this.deliver(data)
    }
  }

  parse (data) {
    const id = data[ID]
    delete data[ID]
    const action = this.actions[data.action || '*']
    delete data.action
    return { id, action }
  }

  async message (data, client, req) {
    data = JSON.parse(data)
    const { id, action } = this.parse(data)
    if (action) {
      const res = await action(data, client, req)
      if (res) {
        if (id) {
          res[ID] = id
        }
        client.send(res)
      }
    }
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