const got = require('got')
const base = 'https://localhost:3002'

describe('Https', () => {
  it('should get https requests', async () => {
    const result = await got(
      `${base}/ssl`,
      { https: { rejectUnauthorized: false } }
    )
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('text/html; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch('ssl')
  })
})
