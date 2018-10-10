const ID = '$__cbid__'

class Socket {
  constructor (message, connection) {
    message = JSON.parse(message)
    this.action = message.action || '*'
    delete message.action
    this[ID] = message[ID]
    delete message[ID]
    this.connection = connection
    this.message = message
  }

  send (data) {
    if (this[ID]) {
      data[ID] = this[ID]
    }
    this.connection.send(JSON.stringify(data))
  }
}

module.exports = Socket