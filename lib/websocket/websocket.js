const uuid = require('uuid/v4')
const ws = require('ws')
const Socket = require('./socket')
const Message = require('./message')
const tools = require('../tools')

const PING_TIMEOUT = 30000

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
    client.isAlive = true
    client.id = uuid()

    if (this.app.options.connect) {
      await this.app.options.connect(client, req)
    }

    client.on('pong', () => {
      client.isAlive = true
    })

    client.on('close', () => {
      client.isAlive = false
    })

    client.on('message', async (data) => {
      this.message(data, client, req)
    })
  }

  async message (data, client, req) {
    const message = new Message(data)
    const socket = new Socket(client, message)
    const action = this.actions[message.action]
    if (action) {
      const res = await action(message, socket, req)
      if (res) {
        socket.send(res)
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

  get sockets () {
    return [...this.server.clients].map(c => new Socket(c))
  }
}

module.exports = Websocket