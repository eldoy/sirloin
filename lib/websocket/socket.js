const ID = '$__cbid__'

class Socket {
  constructor (message, client) {
    message = JSON.parse(message)
    this.action = message.action || '*'
    delete message.action
    this[ID] = message[ID]
    delete message[ID]
    this.client = client
    this.message = message
  }

  send (data) {
    if (this[ID]) {
      data[ID] = this[ID]
    }
    this.client.send(JSON.stringify(data))
  }
}

module.exports = Socket