const Redis = require('ioredis')
const tools = require('./tools')

const DEFAULT_OPTIONS = {}
const DEFAULT_CHANNEL = 'messages'

class Pubsub {
  constructor (websocket) {
    this.websocket = websocket
    this.options = { ...DEFAULT_OPTIONS, ...websocket.app.config.pubsub }
    if (!this.options.channel) {
      this.options.channel = DEFAULT_CHANNEL
    }
    this.connected = false
    this.hub = new Redis(this.options)
    this.channel = new Redis(this.options)
    this.subscribe = this.subscribe.bind(this)
    this.hub.subscribe(this.options.channel, this.subscribe)
    this.message = this.message.bind(this)
    this.hub.on('message', this.message)
  }

  subscribe (err) {
    if (err) {
      tools.log.err('Pubsub can not subscribe to channel \'%s\':\n%s', this.options.channel, err.message)
    } else {
      tools.log.info('Pubsub subscribed to channel \'%s\'', this.options.channel)
      this.connected = true
    }
  }

  callback (client, options) {
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
        const fn = this.callback(client, msg.options)
        client.send(msg.data, msg.options, fn)
        break
      }
    }
  }

  publish (data, options, fn) {
    if (this.connected) {
      const msg = JSON.stringify({ data, options })
      this.channel.publish(this.options.channel, msg)
    }
  }
}

module.exports = Pubsub