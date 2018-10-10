const ID = '$__cbid__'

class Socket {
  constructor (client, message) {
    this.client = client
    this.id = client.id
    this.message = message
  }

  send (data) {
    if (this.message && this.message[ID]) {
      data[ID] = this.message[ID]
    }
    this.client.send(JSON.stringify(data))
  }
}

module.exports = Socket