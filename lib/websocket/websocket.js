const uuid = require('uuid/v4')
const ws = require('ws')
const Socket = require('./socket')
const tools = require('../tools')

const PING_TIMEOUT = 30000

class Websocket {
  constructor (app) {
    this.app = app
    this.actions = {}
    this.websocket = new ws.Server({ server: app.http.server })
    this.connection = this.connection.bind(this)
    this.websocket.on('connection', this.connection)
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
    const socket = new Socket(data, client)
    const action = this.actions[socket.action]
    if (action) {
      const res = await action(socket, req)
      if (res) {
        socket.send(res)
      }
    }
  }

  ping () {
    this.websocket.clients.forEach((client) => {
      if (client.isAlive === false) {
        return client.terminate()
      }
      client.isAlive = false
      client.ping('', false, true)
    })
  }
}

module.exports = Websocket