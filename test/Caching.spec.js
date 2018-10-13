const request = require('request')
const base = 'http://localhost:3000'

describe('Caching', () => {
  it('should return last modified headers for files', (done) => {
    request.get({
      url: `${base}/css/app.css`
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('text/css; charset=utf-8')
      expect(res.headers['last-modified']).toBeDefined()
      expect(typeof body).toEqual('string')
      expect(body).toMatch('body {')
      done()
    })
  })

  it.only('should return last modified headers for files', (done) => {
    request.get({
      url: `${base}/css/app.css`,
      headers: {
        'if-modified-since': (new Date()).toUTCString()
      }
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(304)
      // expect(res.headers['content-type']).toEqual('text/css; charset=utf-8')
      // expect(res.headers['last-modified']).toBeDefined()
      expect(typeof body).toEqual('string')
      expect(body).toMatch('')
      done()
    })
  })
})
