const axios = require('axios')
const base = 'http://localhost:3000'

describe('Webserver', () => {
  it('should return get json', async () => {
    let result = await axios.get(base + '/world')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('world')
  })

  it('should return post json', async () => {
    let result = await axios.post(base + '/world')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('moon')
  })

  it('should not find undefined methods', async () => {
    try {
      result = await axios.put(base + '/')
    } catch (err) {
      expect(err.response.status).toEqual(404)
      expect(err.response.data).toEqual({})
    }
  })

  it('should not find undefined paths', async () => {
    try {
      result = await axios.get(base + '/somethingelse')
    } catch (err) {
      expect(err.response.status).toEqual(404)
      expect(err.response.data).toEqual({})
    }
  })

  it('should run matchall and dynamic routes', async () => {
    const result = await axios.post(base + '/custom')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('custom')
  })

  it('should not run matchall if wrong route', async () => {
    try {
      const result = await axios.post(base + '/not')
    } catch (err) {
      expect(err.response.status).toEqual(404)
      expect(err.response.data).toEqual({})
    }
  })
})
