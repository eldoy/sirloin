const axios = require('axios')
const Socket = require('wsrecon')
const base = 'localhost:3001'
let socket

describe('Proxy', () => {
  beforeAll(() => {
    socket = new Socket('ws://' + base)
  })

  it('should proxy get http requests', async () => {
    let result = await axios.get('http://' + base + '/proxy')
    expect(result.headers['content-type']).toEqual('application/json; charset=utf-8')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('proxy')
  })

  it('should proxy post http requests', async () => {
    let result = await axios.post('http://' + base + '/proxy')
    expect(result.headers['content-type']).toEqual('application/json; charset=utf-8')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('proxy')
  })

  it('should proxy web socket requests', async () => {
    const data = await socket.fetch({ action: 'proxy' })
    expect(data.hello).toEqual('proxy')
  })

  it('should return 404 not found', async (done) => {
    try {
      const data = await axios.get('http://' + base + '/notfound')
    } catch (e) {
      const result = e.response
      expect(result.headers['content-type']).toEqual('application/json; charset=utf-8')
      expect(result.status).toEqual(404)
      expect(result.data).toEqual({})
      done()
    }
  })
})