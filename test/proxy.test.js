const fs = require('fs')
const axios = require('axios')
const Socket = require('wsrecon')
const base = 'localhost:3001'
const path = '/tmp/sirloin-log-test.txt'

describe('Proxy', () => {
  beforeEach(() => {
    try {
      fs.unlinkSync(path)
    } catch (e) {}
  })

  it('should proxy get http requests', async () => {
    const result = await axios.get('http://' + base + '/proxy')
    expect(result.headers['content-type']).toEqual('application/json; charset=utf-8')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('proxy')
  })

  it('should proxy post http requests', async () => {
    const result = await axios.post('http://' + base + '/proxy')
    expect(result.headers['content-type']).toEqual('application/json; charset=utf-8')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('proxy')
  })

  it('should do callbacks for http requests', async () => {
    const result = await axios.get('http://' + base + '/nowhere')
    expect(result.data.hello).toEqual('nowhere')
  })

  it('should return 404 not found', async (done) => {
    try {
      await axios.get('http://' + base + '/notfound')
    } catch (e) {
      const result = e.response
      expect(result.headers['content-type']).toEqual('application/json; charset=utf-8')
      expect(result.status).toBe(404)
      expect(result.data).toBe('')
      done()
    }
  })

  it('should proxy web socket requests', (done) => {
    const socket = new Socket('ws://' + base)
    socket.on('open', async () => {
      const data = await socket.fetch({ $action: 'proxy' })
      expect(data.hello).toEqual('proxy')
      done()
    })
  })
})