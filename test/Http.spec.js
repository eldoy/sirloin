const axios = require('axios')
const base = 'http://localhost:3000'

describe('Http', () => {

  it('should support middleware', async () => {
    let result = await axios.get(base + '/middleware')
    expect(result.headers['content-type']).toEqual('text/html')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('middleware')
  })

  it('should support multiple middleware', async () => {
    let result = await axios.get(base + '/multiple')
    expect(result.headers['content-type']).toEqual('text/html')
    expect(result.headers['content-language']).toEqual('no-NO')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('multiple')
  })

  it('should return from middleware', async () => {
    let result = await axios.get(base + '/middleret')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('middleret')
  })

  it('should errors in middleware', async () => {
    let result = await axios.get(base + '/middleerr')
    expect(result.status).toEqual(200)
    expect(result.data.error).toEqual('middleerr')
  })

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

  it('should return put json', async () => {
    let result = await axios.put(base + '/update')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('updated')
  })

  it('should return delete json', async () => {
    let result = await axios.delete(base + '/remove')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('removed')
  })

  it('should return patch json', async () => {
    let result = await axios.patch(base + '/patch')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('patched')
  })

  it('should return a string', async () => {
    let result = await axios.get(base + '/string')
    expect(result.headers['content-type']).toEqual('text/plain; charset=utf-8')
    expect(result.status).toEqual(200)
    expect(result.data).toEqual('string')
  })

  it('should return a string', async () => {
    let result = await axios.get(base + '/empty')
    expect(result.headers['content-type']).toEqual('text/plain; charset=utf-8')
    expect(result.status).toEqual(200)
    expect(result.data).toEqual('')
  })

  it('should return a number', async () => {
    let result = await axios.get(base + '/number')
    expect(result.headers['content-type']).toEqual('text/plain; charset=utf-8')
    expect(result.status).toEqual(200)
    expect(result.data).toEqual(5)
  })

  it('should return true', async () => {
    let result = await axios.get(base + '/true')
    expect(result.headers['content-type']).toEqual('text/plain; charset=utf-8')
    expect(result.status).toEqual(200)
    expect(result.data).toEqual(true)
  })

  it('should return false', async () => {
    let result = await axios.get(base + '/false')
    expect(result.headers['content-type']).toEqual('text/plain; charset=utf-8')
    expect(result.status).toEqual(200)
    expect(result.data).toEqual(false)
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

  it('should run any routes', async () => {
    let result = await axios.post(base + '/any')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('any')
    result = await axios.get(base + '/any')
    expect(result.status).toEqual(200)
    expect(result.data.hello).toEqual('any')
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

  it('should support normal query parameters', async () => {
    const result = await axios.get(base + '/query?hello=1')
    expect(result.data.hello).toEqual('1')
  })

  it('should support encoded query parameters', async () => {
    const result = await axios.get(base + '/query?hello=hello%20world')
    expect(result.data.hello).toEqual('hello world')
  })

  it('should support post body params', async () => {
    const result = await axios.post(base + '/query', {
      hello: 'hello world'
    })
    expect(result.data.hello).toEqual('hello world')
  })

  it('should support error message handling', async () => {
    const result = await axios.post(base + '/error')
    expect(result.data.error).toEqual('hello error')
  })
})
