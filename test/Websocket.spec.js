const Socket = require('wsrecon')
const base = 'ws://localhost:3000'
let socket
let message

beforeAll((done) => {
  socket = new Socket(base)
  socket.on('open', () => {
    done()
  })
  socket.on('message', (data) => {
    message = data
  })
})

beforeEach(() => {
  message = undefined
})

describe('Websocket', () => {
  it('should connect to web socket', () => {
    expect(socket.readyState).toEqual(1)
  })

  it('should receive a message without action and fetch', async () => {
    const data = await socket.fetch({})
    expect(data.hello).toEqual('world')
  })

  it('should receive a message without action and send', (done) => {
    socket.send({})
    setTimeout(() => {
      expect(message.hello).toEqual('world')
      done()
    }, 50)
  })

  it('should receive a message with action and fetch', async () => {
    const data = await socket.fetch({ action: 'hello' })
    expect(data.hello).toEqual('hi')
  })

  it('should receive a message with action and send', (done) => {
    socket.send({ action: 'hello' })
    setTimeout(() => {
      expect(message.hello).toEqual('hi')
      done()
    }, 50)
  })

  it('should allow mutation of connection object', async () => {
    const data = await socket.fetch({ action: 'mutate' })
    expect(data.hello).toEqual('mutate')
  })
})