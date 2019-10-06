const Web = require('../lib/web.js')
const Sirloin = require('../index.js')
jest.mock('../lib/web.js')

beforeEach(() => {
  Web.mockClear()
  Web.prototype.routes = {}
})

describe('Config', () => {
  it('should call the constructor', () => {
    const app = new Sirloin()
    expect(Web).toHaveBeenCalledTimes(1)
  })

  it('should give correct default options', () => {
    const app = new Sirloin()
    expect(app.config.port).toEqual(3000)
    expect(app.config.files).toEqual('dist')
    expect(app.config.pubsub).toEqual(undefined)
  })

  it('should give correct files option', () => {
    let app = new Sirloin()
    app = new Sirloin({ port: 59501, files: false })
    expect(app.config.files).toEqual(false)
    expect(app.config.port).toEqual(59501)
    app = new Sirloin({ port: 59502, files: 'public' })
    expect(app.config.files).toEqual(false)
    expect(app.config.port).toEqual(59502)
    app = new Sirloin({ port: 59503, files: 'bin' })
    expect(app.config.files).toEqual('bin')
    expect(app.config.port).toEqual(59503)
  })
})