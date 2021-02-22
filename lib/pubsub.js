const Redis = require('ioredis')

const OPTIONS = { channel: 'messages' }

class Pubsub {
  constructor(app, websocket) {
    this.app = app
    this.websocket = websocket
    this.options = { ...OPTIONS, ...app.config.pubsub }
    this.connected = false
    this.hub = new Redis(this.options)
    this.channel = new Redis(this.options)
    this.hub.subscribe(this.options.channel, this.subscribe.bind(this))
    this.hub.on('message', this.message.bind(this))
  }

  subscribe(err) {
    if (err) {
      console.log('Pubsub channel unavailable \'%s\':\n%s', this.options.channel, err.message)
      throw err
    } else {
      console.log('Pubsub subscribed to channel \'%s\'', this.options.channel)
      this.connected = true
    }
  }

  async message(channel, msg) {
    const { name, data, options } = JSON.parse(msg)
    const { clientid, cbid } = options
    const client = this.websocket.clients.find(c => c.id == clientid)
    const callback = this.websocket.getCallback(cbid)
    await this.app.api[name](data, client)
    if (client && callback) callback()
  }

  publish(name, data, options) {
    if (this.connected) {
      const msg = JSON.stringify({ name, data, options })
      this.channel.publish(this.options.channel, msg)
    }
  }
}

module.exports = Pubsub
