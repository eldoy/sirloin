const got = require('got')
const base = 'https://localhost:3002'

describe('Https', () => {
  it('should get https requests', async () => {
    const res = await got(
      `${base}/ssl`,
      { https: { rejectUnauthorized: false } }
    )
    expect(res.statusCode).toEqual(200)
    expect(res.headers['content-type']).toEqual('application/json; charset=utf-8')
    expect(typeof res.body).toEqual('string')
    expect(res.body).toMatch('ssl')
  })
})
