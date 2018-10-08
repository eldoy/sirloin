const ID = '$__cbid__'

class Socket {
  constructor (message, ws) {
    message = JSON.parse(message)
    this.action = message.action || '*'
    this[ID] = message[ID]
    delete message[ID]
    this.ws = ws
    this.message = message
  }

  send (data) {
    if (this[ID]) {
      data[ID] = this[ID]
    }
    this.ws.send(JSON.stringify(data))
  }
}

module.exports = Socket