const Redis = require('ioredis')

module.exports = function sub(websocket, state, config) {
  const pubsub = { callbacks: {} }

  if (config.pubsub) {

    // Channel to send on
    pubsub.publisher = new Redis(config.pubsub)

    // Receiver is the channel to receive on
    pubsub.receiver = new Redis(config.pubsub)

    pubsub.receiver.subscribe(config.pubsub.channel, subscribeChannel)
    pubsub.receiver.on('message', pubsubMessage)
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
  async function pubsubMessage(channel, msg) {
    const { name, data, options } = JSON.parse(msg)
    const { clientid, cbid } = options
    const client = [...websocket.clients].find(c => c.id == clientid)
    const callback = pubsub.callbacks[cbid]
    delete pubsub.callbacks[cbid]
    await state.handlers[name](data, client)
    if (callback) callback()
  }

  return pubsub
}