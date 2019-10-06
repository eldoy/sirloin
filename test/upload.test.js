const request = require('request')
const fs = require('fs')
const base = 'http://localhost:3000'

describe('Upload', () => {
  it('should upload a file', (done) => {
    var formData = {
      file: fs.createReadStream('./test/assets/hello.txt')
    }
    request.post({
      url: `${base}/upload`,
      headers: {
        'content-type': 'multipart/form-data'
      },
      formData: formData
    },
    (err, res, body) => {
      expect(err).toEqual(null)
      if (err) {
        console.error('Upload failed:', err)
      }
      expect(typeof body).toEqual('string')
      const data = JSON.parse(body)
      expect(typeof data).toEqual('object')
      expect(data.name).toEqual('hello.txt')
      done()
    })
  })
})