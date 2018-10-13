const request = require('request')
const base = 'http://localhost:3000'

describe('Files', () => {
  it('should serve static css file', (done) => {
    request.get({
      url: `${base}/css/app.css`
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('text/css; charset=utf-8')
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
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('application/javascript; charset=utf-8')
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
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('text/html; charset=utf-8')
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
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('text/html; charset=utf-8')
      expect(typeof body).toEqual('string')
      expect(body).toMatch("<h1>Hello</h1>")
      done()
    })
  })

  it('should serve static html empty file', (done) => {
    request.get({
      url: `${base}/empty.html`
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('text/html; charset=utf-8')
      expect(typeof body).toEqual('string')
      expect(body).toEqual('')
      done()
    })
  })

  it('should serve static html tar.gz file', (done) => {
    request.get({
      url: `${base}/file.tar.gz`
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('application/gzip')
      expect(typeof body).toEqual('string')
      expect(body).not.toEqual('')
      done()
    })
  })

  it('should serve static html jquery.min.js file', (done) => {
    request.get({
      url: `${base}/js/jquery.min.js`
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('application/javascript; charset=utf-8')
      expect(typeof body).toEqual('string')
      expect(body).toEqual('')
      done()
    })
  })
})