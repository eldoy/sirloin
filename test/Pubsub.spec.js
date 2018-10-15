const Socket = require('wsrecon')
const base = 'ws://localhost:3000'
let socket
let messages = []

beforeAll((done) => {
  socket = new Socket(base)
  socket.on('open', () => {
    done()
  })
  socket.on('message', (data) => {
    // console.log('RECEIVED MESSAGE: %o', data)
    messages.push(data)
  })
})

beforeEach(() => {
  messages = []
})

describe('Pubsub', () => {
  it('should work with send callbacks', (done) => {
    socket.send({ action: 'callback' })
    setTimeout(() => {
      expect(messages[0].hello).toEqual('moon')
      expect(messages[1].hello).toEqual('callback')
      expect(messages[2].hello).toEqual('world')
      done()
    }, 50)
  })

  it('should work with send promises', (done) => {
    socket.send({ action: 'promise' })
    setTimeout(() => {
      expect(messages[0].hello).toEqual('moon')
      expect(messages[1].hello).toEqual('callback')
      expect(messages[2].hello).toEqual('world')
      done()
    }, 50)
  })
})