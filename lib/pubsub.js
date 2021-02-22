const Redis = require('ioredis')

const OPTIONS = { channel: 'messages' }

class Pubsub {
  constructor(app, websocket) {
    this.settings = { ...OPTIONS, ...app.config.pubsub }
    this.connected = false
    this.channel = new Redis(this.settings)

    const hub = new Redis(this.settings)
    hub.subscribe(this.settings.channel, (err) => {
      if (err) {
        console.log('Pubsub channel unavailable \'%s\':\n%s', this.settings.channel, err.message)
        throw err
      } else {
        console.log('Pubsub subscribed to channel \'%s\'', this.settings.channel)
        this.connected = true
      }
    })
    hub.on('message', async (channel, msg) => {
      const { name, data, options } = JSON.parse(msg)
      const { clientid, cbid } = options
      const clients = [...websocket.server.clients]
      const client = clients.find(c => c.id == clientid)
      const callback = websocket.callbacks[cbid]
      delete websocket.callbacks[cbid]
      await app.api[name](data, client)
      if (client && callback) callback()
    })
  }

  publish(name, data, options) {
    if (this.connected) {
      const msg = JSON.stringify({ name, data, options })
      this.channel.publish(this.settings.channel, msg)
    }
  }
}

module.exports = Pubsub
