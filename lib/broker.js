const Redis = require('ioredis')

module.exports = function broker(websocket, state, config) {
  const pubsub = { callbacks: {} }

  if (config.pubsub) {

    // Redis connection to send on
    pubsub.publisher = new Redis(config.pubsub)

    // Redis connection to receive on
    pubsub.subscriber = new Redis(config.pubsub)

    pubsub.subscriber.subscribe(config.pubsub.channel, subscribeChannel)
    pubsub.subscriber.on('message', pubsubMessage)
  }

  // Subscribe to config channel name
  function subscribeChannel(err) {
    const { channel } = config.pubsub
    if (err) {
      console.log(`Pubsub channel '${channel}' is unavailable`)
      console.log(err.message)
      throw err
    } else {
      console.log(`Pubsub subscribed to channel '${channel}'`)
      pubsub.connected = true
    }
  }

  // Receive messages here from publish
  async function pubsubMessage(channel, message) {
    const { name, data, options } = JSON.parse(message)
    const { clientid, cbid } = options
    const client = [...websocket.clients].find(c => c.id == clientid)
    const callback = pubsub.callbacks[cbid]
    delete pubsub.callbacks[cbid]
    await state.handlers[name](data, client)
    if (typeof callback == 'function') callback()
  }

  return pubsub
}
