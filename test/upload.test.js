const got = require('got')
const FormData = require('form-data')
const fs = require('fs')
const base = 'http://localhost:3000'

describe('Upload', () => {
  it('should upload a file', async () => {
    var form = new FormData()
    form.append('file', fs.createReadStream('./test/assets/hello.txt'))

    const res = await got.post({
      url: `${base}/upload`,
      body: form
    })
    expect(typeof res.body).toEqual('string')
    const data = JSON.parse(res.body)
    expect(typeof data).toEqual('object')
    expect(data.name).toEqual('hello.txt')
  })
})