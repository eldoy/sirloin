const ID = '$__cbid__'

class Message {
  constructor (message) {
    message = JSON.parse(message)
    this.action = message.action || '*'
    delete message.action

    this[ID] = message[ID]
    delete message[ID]
    this.data = message
  }
}

module.exports = Message