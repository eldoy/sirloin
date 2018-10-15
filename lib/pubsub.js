const Redis = require('ioredis')
const tools = require('./tools')

const CHANNEL_NAME = 'messages'
const DEFAULT_OPTIONS = { lazyConnect: true }

class Pubsub {
  constructor (websocket) {
    this.websocket = websocket
    const options = { ...DEFAULT_OPTIONS, ...websocket.app.config.pubsub }
    this.hub = new Redis(options)
    this.channel = new Redis(options)
    this.subscribe = this.subscribe.bind(this)
    this.hub.subscribe(CHANNEL_NAME, this.subscribe)
    this.message = this.message.bind(this)
    this.hub.on('message', this.message)
  }

  subscribe (err) {
    if (err) {
      tools.log.err('Pubsub can not subscribe to channel \'%s\':\n%s', CHANNEL_NAME, err.message)
    } else {
      tools.log.info('Pubsub subscribed to channel \'%s\'', CHANNEL_NAME)
      this.connected = true
    }
  }

  findCallback (client, options) {
    const id = options.fn
    if (id) {
      const fn = client.callbacks[id]
      delete client.callbacks[id]
      return fn
    }
  }

  message (channel, msg) {
    msg = JSON.parse(msg)
    const clients = this.websocket.clients
    for (let i = clients.length - 1; i >= 0; i--) {
      const client = clients[i]
      if (client.id === msg.options.id) {
        msg.options.pubsub = false
        const fn = this.findCallback(client, msg.options)
        client.send(msg.data, msg.options, fn)
        break
      }
    }
  }

  publish (data, options, fn) {
    if (this.connected) {
      const msg = JSON.stringify({ data, options })
      this.channel.publish(CHANNEL_NAME, msg)
    }
  }
}

module.exports = Pubsub