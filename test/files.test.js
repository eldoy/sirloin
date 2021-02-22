const got = require('got')
const base = 'http://localhost:3000'

describe('Files', () => {
  it('should serve static css file', async () => {
    const result = await got({ url: `${base}/css/app.css` })
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('text/css; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch('body {')
  })

  it('should serve static js file', async () => {
    const result = await got({ url: `${base}/js/app.js` })
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('application/javascript; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch("console.log('Hello')")
  })

  it('should serve static html file', async () => {
    const result = await got({ url: `${base}/file.html` })
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('text/html; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch("<h1>File</h1>")
  })

  it('should serve static html index file', async () => {
    const result = await got({ url: `${base}/` })
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('text/html; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch("<h1>Hello</h1>")
  })

  it('should serve static html empty file', async () => {
    const result = await got({ url: `${base}/empty.html` })
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('text/html; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toEqual('')
  })

  it('should serve static html tar.gz file', async () => {
    const result = await got({ url: `${base}/file.tar.gz` })
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('application/gzip')
    expect(typeof result.body).toEqual('string')
    expect(result.body).not.toEqual('')
  })

  it('should serve static html jquery.min.js file', async () => {
    const result = await got({ url: `${base}/js/jquery.min.js` })
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('application/javascript; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toEqual('')
  })

  it('should support HEAD requests', async () => {
    const result = await got({ method: 'HEAD', url: `${base}/file.html` })
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('text/html; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toEqual('')
  })
})
