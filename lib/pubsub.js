const Redis = require('ioredis')

const OPTIONS = { channel: 'messages' }

class Pubsub {
  constructor(app, websocket) {
    this.options = { ...OPTIONS, ...app.config.pubsub }
    this.connected = false
    this.channel = new Redis(this.options)

    const hub = new Redis(this.options)
    hub.subscribe(this.options.channel, (err) => {
      if (err) {
        console.log('Pubsub channel unavailable \'%s\':\n%s', this.options.channel, err.message)
        throw err
      } else {
        console.log('Pubsub subscribed to channel \'%s\'', this.options.channel)
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
      this.channel.publish(this.options.channel, msg)
    }
  }
}

module.exports = Pubsub
