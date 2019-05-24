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
      console.log('Pubsub can not subscribe to channel \'%s\':\n%s', this.options.channel, err.message)
      throw err
    } else {
      console.log('Pubsub subscribed to channel \'%s\'', this.options.channel)
      this.connected = true
    }
  }

  extract({ clientid, cbid }) {
    if (!clientid) {
      return {}
    }
    const clients = this.websocket.clients
    for (let i = clients.length - 1; i >= 0; i--) {
      const client = clients[i]
      if (client.id === clientid) {
        const callback = this.websocket.getCallback(cbid)
        return { client, callback }
      }
    }
  }

  async message(channel, msg) {
    const { name, data, options } = JSON.parse(msg)
    const { client, callback } = this.extract(options)
    await this.app.api[name](data, client)
    if (callback) callback()
  }

  publish(name, data, options) {
    if (this.connected) {
      const msg = JSON.stringify({ name, data, options })
      this.channel.publish(this.options.channel, msg)
    }
  }
}

module.exports = Pubsub
