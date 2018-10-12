const Redis = require('ioredis')
const tools = require('./tools')

const CHANNEL_NAME = 'messages'

class Pubsub {
  constructor (websocket) {
    this.websocket = websocket
    const options = websocket.app.config.pubsub || {}
    this.hub = new Redis(options)
    this.channel = new Redis(options)
    this.connected = false
    this.subscribe = this.subscribe.bind(this)
    this.hub.subscribe(CHANNEL_NAME, this.subscribe)
    this.message = this.message.bind(this)
    this.hub.on('message', this.message)
  }

  subscribe (err) {
    if (err) {
      tools.log('Pubsub can not subscribe to channel \'%s\':\n%s', CHANNEL_NAME, err.message)
    } else {
      tools.log('Pubsub subscribed to channel \'%s\'', CHANNEL_NAME)
      this.connected = true
    }
  }

  message (channel, msg) {
    msg = JSON.parse(msg)
    const clients = this.websocket.clients
    for (let i = clients.length - 1; i >= 0; i--) {
      const client = clients[i]
      if (client.id === msg.id) {
        client.send(msg.data, false)
        break
      }
    }
  }

  publish (data, id) {
    if (this.connected) {
      const msg = JSON.stringify({ data, id })
      this.channel.publish(CHANNEL_NAME, msg)
    }
  }
}

module.exports = Pubsub