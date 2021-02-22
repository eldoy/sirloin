const Redis = require('ioredis')

const OPTIONS = { channel: 'messages' }

module.exports = function(app, websocket) {
  const settings = { ...OPTIONS, ...app.config.pubsub }
  let connected = false
  const channel = new Redis(settings)

  const hub = new Redis(settings)
  hub.subscribe(settings.channel, (err) => {
    if (err) {
      console.log('Pubsub channel unavailable \'%s\':\n%s', settings.channel, err.message)
      throw err
    } else {
      console.log('Pubsub subscribed to channel \'%s\'', settings.channel)
      connected = true
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

  return function(name, data, options) {
    if (connected) {
      const msg = JSON.stringify({ name, data, options })
      channel.publish(settings.channel, msg)
    }
  }
}
