const request = require('request')
const base = 'http://localhost:3000'

describe('Static', () => {
  it('should serve static css file', (done) => {
    request.get({
      url: `${base}/css/app.css`
    },
    (err, res, body) => {
      expect(res.headers['content-type']).toEqual('text/css')
      expect(typeof body).toEqual('string')
      expect(body).toMatch('body {')
      done()
    })
  })

  it('should serve static js file', (done) => {
    request.get({
      url: `${base}/js/app.js`
    },
    (err, res, body) => {
      expect(res.headers['content-type']).toEqual('application/javascript')
      expect(typeof body).toEqual('string')
      expect(body).toMatch("console.log('Hello'")
      done()
    })
  })

  it('should serve static html file', (done) => {
    request.get({
      url: `${base}/file.html`
    },
    (err, res, body) => {
      expect(res.headers['content-type']).toEqual('text/html')
      expect(typeof body).toEqual('string')
      expect(body).toMatch("<h1>File</h1>")
      done()
    })
  })

  it('should serve static html index file', (done) => {
    request.get({
      url: `${base}/`
    },
    (err, res, body) => {
      expect(res.headers['content-type']).toEqual('text/html')
      expect(typeof body).toEqual('string')
      expect(body).toMatch("<h1>Hello</h1>")
      done()
    })
  })
})