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
    this.websocket.on('connection', async (connection, req) => {
      tools.setRequestProperties(req)
      connection.isAlive = true
      connection.id = uuid()

      if (app.options.connect) {
        await app.options.connect(connection, req)
      }

      connection.on('pong', () => {
        connection.isAlive = true
      })

      connection.on('close', () => {
        connection.isAlive = false
      })

      connection.on('message', async (message) => {
        const socket = new Socket(message, connection)
        const action = this.actions[socket.action]
        if (action) {
          const data = await action(socket, req)
          if (data) {
            socket.send(data)
          }
        }
      })
    })

    this.interval = setInterval(() => {
      this.websocket.clients.forEach((connection) => {
        if (connection.isAlive === false) {
          return connection.terminate()
        }
        connection.isAlive = false
        connection.ping('', false, true)
      })
    }, PING_TIMEOUT)
  }
}

module.exports = Websocket