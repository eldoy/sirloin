const Redis = require('ioredis')
const tools = require('./tools')

const OPTIONS = { channel: 'messages' }

class Pubsub {
  constructor (websocket) {
    this.websocket = websocket
    this.options = { ...OPTIONS, ...websocket.app.config.pubsub }
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
      throw err
    } else {
      tools.log.info('Pubsub subscribed to channel \'%s\'', this.options.channel)
      this.connected = true
    }
  }

  extract ({ id, cbid }) {
    if (!id) return {}
    const clients = this.websocket.clients
    for (let i = clients.length - 1; i >= 0; i--) {
      const client = clients[i]
      if (client.id === id) {
        const callback = this.websocket.getCallback(cbid)
        return { client, callback }
      }
    }
  }

  async message (channel, msg) {
    const { name, data, options } = JSON.parse(msg)
    const { client, callback } = this.extract(options)
    await this.websocket.app.api[name](data, client)
    if (callback) callback()
  }

  publish (name, data, options) {
    if (this.connected) {
      const msg = JSON.stringify({ name, data, options })
      this.channel.publish(this.options.channel, msg)
    }
  }
}

module.exports = Pubsub