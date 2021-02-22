const got = require('got')
const base = 'http://localhost:3000'

describe('Caching', () => {
  it('should return last modified headers for files', async () => {
    const res = await got({ url: `${base}/css/app.css` })
    expect(res.statusCode).toEqual(200)
    expect(res.headers['content-type']).toEqual('text/css; charset=utf-8')
    expect(res.headers['last-modified']).toBeDefined()
    expect(typeof res.body).toEqual('string')
    expect(res.body).toMatch('body {')
  })

  it('should return last modified headers for files', async () => {
    const res = await got({
      url: `${base}/css/app.css`,
      headers: {
        'if-modified-since': (new Date()).toUTCString()
      }
    })
    expect(res.statusCode).toEqual(304)
    expect(typeof res.body).toEqual('string')
    expect(res.body).toMatch('')
  })
})
