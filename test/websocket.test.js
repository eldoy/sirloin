const ws = require('wsrecon')
const base = 'ws://localhost:3000'
let socket
let message
let messages = []

function sleep(ms = 100) {
  return new Promise(r => setTimeout(r, ms))
}

beforeAll(async () => {
  socket = await ws(base)
  await sleep()
  socket.on('message', data => {
    message = data
    messages.push(data)
  })
})

beforeEach(() => {
  message = undefined
  messages = []
})

describe('websocket', () => {

  it('should receive a message without action and fetch', async () => {
    socket.send({})
    await sleep()
    expect(message.hello).toEqual('world')
  })

  it('should receive a message with action and fetch', async () => {
    socket.send({ $action: 'hello' })
    await sleep()
    expect(message.hello).toEqual('hi')
  })

  it('should allow mutation of connection object', async () => {
    socket.send({ $action: 'mutate' })
    await sleep()
    expect(message.hello).toEqual('mutate')
  })

  it('should return the number of clients (set)', async () => {
    socket.send({ $action: 'count' })
    await sleep()
    expect(message.hello).toBeGreaterThan(0)
  })

  it('should return the number of clients (array)', async () => {
    socket.send({ $action: 'clients' })
    await sleep()
    expect(message.hello).toBeGreaterThan(0)
  })

  it('should return the message you sent', async () => {
    socket.send({ $action: 'bounce', hello: 1 })
    await sleep()
    expect(message.hello).toEqual(1)
  })

  it('should support error messages', async () => {
    socket.send({ $action: 'error' })
    await sleep()
    expect(message.error).toEqual('websocket error')
  })
})
