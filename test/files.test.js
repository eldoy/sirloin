const got = require('got')
const base = 'http://localhost:3000'

describe('Files', () => {
  it('should serve static css file', async () => {
    const res = await got({ url: `${base}/css/app.css` })
    expect(res.statusCode).toEqual(200)
    expect(res.headers['content-type']).toEqual('text/css; charset=utf-8')
    expect(typeof res.body).toEqual('string')
    expect(res.body).toMatch('body {')
  })

  it('should serve static js file', async () => {
    const res = await got({ url: `${base}/js/app.js` })
    expect(res.statusCode).toEqual(200)
    expect(res.headers['content-type']).toEqual('application/javascript; charset=utf-8')
    expect(typeof res.body).toEqual('string')
    expect(res.body).toMatch("console.log('Hello')")
  })

  it('should serve static html file', async () => {
    const res = await got({ url: `${base}/file.html` })
    expect(res.statusCode).toEqual(200)
    expect(res.headers['content-type']).toEqual('text/html; charset=utf-8')
    expect(typeof res.body).toEqual('string')
    expect(res.body).toMatch("<h1>File</h1>")
  })

  it('should serve static html index file', async () => {
    const res = await got({ url: `${base}/` })
    expect(res.statusCode).toEqual(200)
    expect(res.headers['content-type']).toEqual('text/html; charset=utf-8')
    expect(typeof res.body).toEqual('string')
    expect(res.body).toMatch("<h1>Hello</h1>")
  })

  it('should serve static html empty file', async () => {
    const res = await got({ url: `${base}/empty.html` })
    expect(res.statusCode).toEqual(200)
    expect(res.headers['content-type']).toEqual('text/html; charset=utf-8')
    expect(typeof res.body).toEqual('string')
    expect(res.body).toEqual('')
  })

  it('should serve static html tar.gz file', async () => {
    const res = await got({ url: `${base}/file.tar.gz` })
    expect(res.statusCode).toEqual(200)
    expect(res.headers['content-type']).toEqual('application/gzip')
    expect(typeof res.body).toEqual('string')
    expect(res.body).not.toEqual('')
  })

  it('should serve static html jquery.min.js file', async () => {
    const res = await got({ url: `${base}/js/jquery.min.js` })
    expect(res.statusCode).toEqual(200)
    expect(res.headers['content-type']).toEqual('application/javascript; charset=utf-8')
    expect(typeof res.body).toEqual('string')
    expect(res.body).toEqual('')
  })

  it('should support HEAD requests', async () => {
    const res = await got({ method: 'HEAD', url: `${base}/file.html` })
    expect(res.statusCode).toEqual(200)
    expect(res.headers['content-type']).toEqual('text/html; charset=utf-8')
    expect(typeof res.body).toEqual('string')
    expect(res.body).toEqual('')
  })
})
