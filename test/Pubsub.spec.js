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
    }, 40)
  })

  it('should work with send promises', (done) => {
    socket.send({ action: 'promise' })
    setTimeout(() => {
      expect(messages[0].hello).toEqual('moon')
      expect(messages[1].hello).toEqual('callback')
      expect(messages[2].hello).toEqual('world')
      done()
    }, 40)
  })

  it('should publish messages to all clients', (done) => {
    socket.send({ action: 'publish' })
    setTimeout(() => {
      expect(messages[0].published).toBe(true)
      expect(messages[1].hello).toEqual('world')
      done()
    }, 40)
  })

  it('should publish messages to all clients with await', (done) => {
    socket.send({ action: 'publishawait' })
    setTimeout(() => {
      expect(messages[0].hello).toEqual('await')
      expect(messages[1].published).toBe(true)
      done()
    }, 40)
  })

  it('should publish messages to all clients with callback', (done) => {
    socket.send({ action: 'publishcallback' })
    setTimeout(() => {
      expect(messages[0].published).toBe(true)
      expect(messages[1].hello).toEqual('publish')
      expect(messages[2].hello).toEqual('callback')
      done()
    }, 40)
  })

  it('should publish messages to all clients without a client', (done) => {
    socket.send({ action: 'publishall' })
    setTimeout(() => {
      expect(messages[0].published).toBe(true)
      expect(messages[1].hello).toEqual('publish')
      done()
    }, 40)
  })
})