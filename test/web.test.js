const got = require('got')
const base = 'http://localhost:3000'

describe('Web', () => {
  it('should support middleware', async () => {
    let result = await got(base + '/middleware', { responseType: 'json' })
    expect(result.headers['content-type']).toEqual('text/html')
    expect(result.statusCode).toEqual(200)
    expect(result.body.hello).toEqual('middleware')
  })

  it('should support multiple middleware', async () => {
    let result = await got(base + '/multiple', { responseType: 'json' })
    expect(result.headers['content-type']).toEqual('text/html')
    expect(result.headers['content-language']).toEqual('no-NO')
    expect(result.statusCode).toEqual(200)
    expect(result.body.hello).toEqual('multiple')
  })

  it('should return from middleware', async () => {
    let result = await got(base + '/middleret', { responseType: 'json' })
    expect(result.statusCode).toEqual(200)
    expect(result.body.hello).toEqual('middleret')
  })

  it('should errors in middleware', async () => {
    let result = await got(base + '/middleerr', { responseType: 'json' })
    expect(result.statusCode).toEqual(200)
    expect(result.body.error).toEqual('middleerr')
  })

  it('should return get json', async () => {
    let result = await got(base + '/world', { responseType: 'json' })
    expect(result.statusCode).toEqual(200)
    expect(result.body.hello).toEqual('world')
  })

  it('should return post json', async () => {
    let result = await got.post(base + '/world', { responseType: 'json' })
    expect(result.statusCode).toEqual(200)
    expect(result.body.hello).toEqual('moon')
  })

  it('should return put json', async () => {
    let result = await got.put(base + '/update', { responseType: 'json' })
    expect(result.statusCode).toEqual(200)
    expect(result.body.hello).toEqual('updated')
  })

  it('should return delete json', async () => {
    let result = await got.delete(base + '/remove', { responseType: 'json' })
    expect(result.statusCode).toEqual(200)
    expect(result.body.hello).toEqual('removed')
  })

  it('should return patch json', async () => {
    let result = await got.patch(base + '/patch', { responseType: 'json' })
    expect(result.statusCode).toEqual(200)
    expect(result.body.hello).toEqual('patched')
  })

  it('should return a string', async () => {
    let result = await got(base + '/string')
    expect(result.headers['content-type']).toEqual('text/plain; charset=utf-8')
    expect(result.statusCode).toEqual(200)
    expect(result.body).toEqual('string')
  })

  it('should return a string', async () => {
    let result = await got(base + '/empty')
    expect(result.headers['content-type']).toEqual('text/plain; charset=utf-8')
    expect(result.statusCode).toEqual(200)
    expect(result.body).toEqual('')
  })

  it('should return a number', async () => {
    let result = await got(base + '/number', { responseType: 'json' })
    expect(result.headers['content-type']).toEqual('text/plain; charset=utf-8')
    expect(result.statusCode).toEqual(200)
    expect(result.body).toEqual(5)
  })

  it('should return true', async () => {
    let result = await got(base + '/true', { responseType: 'json' })
    expect(result.headers['content-type']).toEqual('text/plain; charset=utf-8')
    expect(result.statusCode).toEqual(200)
    expect(result.body).toEqual(true)
  })

  it('should return false', async () => {
    let result = await got(base + '/false', { responseType: 'json' })
    expect(result.headers['content-type']).toEqual('text/plain; charset=utf-8')
    expect(result.statusCode).toEqual(200)
    expect(result.body).toEqual(false)
  })

  it('should not find undefined method', async () => {
    try {
      result = await got.put(base + '/')
    } catch (err) {
      expect(err.response.statusCode).toEqual(404)
      expect(err.response.body).toEqual('')
    }
  })

  it('should not find undefined paths', async () => {
    try {
      result = await got(base + '/somethingelse')
    } catch (err) {
      expect(err.response.statusCode).toEqual(404)
      expect(err.response.body).toEqual('')
    }
  })

  it('should run any routes', async () => {
    let result = await got.post(base + '/any', { responseType: 'json' })
    expect(result.statusCode).toEqual(200)
    expect(result.body.hello).toEqual('any')
    result = await got(base + '/any', { responseType: 'json' })
    expect(result.statusCode).toEqual(200)
    expect(result.body.hello).toEqual('any')
  })

  it('should run matchall and dynamic routes', async () => {
    const result = await got.post(base + '/custom', { responseType: 'json' })
    expect(result.statusCode).toEqual(200)
    expect(result.body.hello).toEqual('custom')
  })

  it('should not run matchall if wrong route', async () => {
    try {
      const result = await got.post(base + '/not')
    } catch (err) {
      expect(err.response.statusCode).toEqual(404)
      expect(err.response.body).toEqual('')
    }
  })

  it('should support normal query parameters', async () => {
    const result = await got(base + '/query?hello=1', { responseType: 'json' })
    expect(result.body.hello).toEqual('1')
  })

  it('should support encoded query parameters', async () => {
    const result = await got(base + '/query?hello=hello%20world', { responseType: 'json' })
    expect(result.body.hello).toEqual('hello world')
  })

  it('should support post body params', async () => {
    const result = await got.post(base + '/query', {
      json: { hello: 'hello world'},
      responseType: 'json'
    })
    expect(result.body.hello).toEqual('hello world')
  })

  it('should support error message handling', async () => {
    const result = await got.post(base + '/error', { responseType: 'json' })
    expect(result.body.error).toEqual('hello error')
  })

  it('should support cookies', async () => {
    const result = await got(base + '/cookie')
    expect(result.headers['set-cookie'][0]).toMatch('name=hello')
  })
})
