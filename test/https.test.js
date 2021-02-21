const request = require('request')
const base = 'https://localhost:3002'
const load = 'https://localhost:3003'

describe('Https', () => {
  it('should get https requests', (done) => {
    request.get({
      rejectUnauthorized: false,
      url: `${base}/ssl`
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('application/json; charset=utf-8')
      expect(typeof body).toEqual('string')
      expect(body).toMatch('ssl')
      done()
    })
  })
})
