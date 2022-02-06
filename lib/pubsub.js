const Redis = require('ioredis')

module.exports = function pubsub(config) {
  if (!config.pubsub.channel) {
    config.pubsub.channel = 'messages'
  }

  const name = config.pubsub.channel

  // Channel to send on
  config.pubsub.publisher = new Redis(config.pubsub)

  // Hub is the channel to receive on
  config.pubsub.receiver = new Redis(config.pubsub)

  // Subscribe to config channel name
  function subscribeChannel(err) {
    if (err) {
      console.log(`Pubsub channel '${name}' is unavailable`)
      console.log(err.message)
      throw err
    } else {
      console.log(`Pubsub subscribed to channel '${name}'`)
      config.pubsub.connected = true
    }
  }
  config.pubsub.receiver.subscribe(name, subscribeChannel)
}
