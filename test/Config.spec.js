const Sirloin = require('../index.js')

describe('Sirloin', () => {
  it('should give correct default options', () => {
    const app = new Sirloin({ port: 59499 })
    expect(app.config.port).toEqual(59499)
    expect(app.config.files).toEqual('dist')
    expect(app.config.pubsub).toEqual(undefined)
  })

  it('should give correct files option', () => {
    let app = new Sirloin({ port: 59500 })
    expect(app.config.files).toEqual('dist')
    app = new Sirloin({ port: 59501, files: false })
    expect(app.config.files).toEqual(false)
    app = new Sirloin({ port: 59502, files: 'public' })
    expect(app.config.files).toEqual(false)
    app = new Sirloin({ port: 59503, files: 'bin' })
    expect(app.config.files).toEqual('bin')
  })
})