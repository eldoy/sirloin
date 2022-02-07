const Redis = require('ioredis')
const { v4: uuid } = require('uuid')

module.exports = function(app, state, config) {

  if (!config.pubsub) return

  const callbacks = {}

  const { channel = 'messages' } = config.pubsub

  // Redis connection to send on
  const publisher = new Redis(config.pubsub)

  // Redis connection to receive on
  const subscriber = new Redis(config.pubsub)

  subscriber.subscribe(channel, subscribeChannel)
  subscriber.on('message', pubsubMessage)

  // Subscribe to config channel name
  function subscribeChannel(err) {
    if (err) {
      console.log(`Pubsub channel '${channel}' is unavailable`)
      console.log(err.message)
      throw err
    } else {
      console.log(`Pubsub subscribed to channel '${channel}'`)
    }
  }

  // Receive messages here from publish
  async function pubsubMessage(channel, message) {
    const { name, data, options } = JSON.parse(message)
    const { clientid, cbid } = options
    const client = [...app.websocket.clients].find(c => c.id == clientid)
    const callback = callbacks[cbid]
    delete callbacks[cbid]
    await state.handlers[name](data, client)
    if (typeof callback == 'function') callback()
  }

  function publish(name, data, options = {}, fn, client) {
    if (typeof options == 'function') {
      fn = options; options = {}
    }
    if (client) options.clientid = client.id
    function send(cb) {
      callbacks[options.cbid = uuid()] = cb
      const message = JSON.stringify({ name, data, options })
      publisher.publish(channel, message)
    }
    return fn ? send(fn) : new Promise(send)
  }

  return {
    channel,
    publisher,
    subscriber,
    publish
  }
}
