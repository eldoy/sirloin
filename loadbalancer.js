const fs = require('fs')
const Sirloin = require('./index.js')
const app = new Sirloin({ port: 3001, proxy: true })

// Also works: app.proxy('*', 'http://localhost:3000')
app.proxy('/proxy', 'http://localhost:3000')

app.proxy('*', 'ws://localhost:3000')

app.proxy('/nowhere', 'ws://localhost:3000', async (req) => {
  return false
})

app.proxy('/nowhere', 'http://localhost:3000', async (req) => {
  return { hello: 'nowhere' }
})
