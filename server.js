const Webserver = require('./index.js')

const app = new Webserver({
  port: 3000,
  static: 'dist', // Static assets folder
  connect: async (client, req) => {
    client.mutate = 'mutate'
  }
})

app.use(async (req, res) => {
  if (['/middleware', '/multiple'].includes(req.pathname)) {
    res.setHeader('Content-Type', 'text/html')
  }
})

app.use(async (req, res) => {
  if (['/multiple'].includes(req.pathname)) {
    res.setHeader('Content-Language', 'no-NO')
  }
})
app.use(async (req, res) => {
  if (['/middleret'].includes(req.pathname)) {
    return { hello: 'middleret'}
  }
})

app.get('/middleware', async (req, res) => {
  return { hello: 'middleware' }
})

app.get('/multiple', async (req, res) => {
  return { hello: 'multiple' }
})

app.get('/world', async (req, res) => {
  return { hello: 'world' }
})

app.post('/world', async (req, res) => {
  return { hello: 'moon' }
})

app.put('/update', async (req, res) => {
  return { hello: 'updated' }
})

app.delete('/remove', async (req, res) => {
  return { hello: 'removed' }
})

app.patch('/patch', async (req, res) => {
  return { hello: 'patched' }
})

app.post('/query', async (req, res) => {
  return { hello: req.query.hello }
})

app.post('/upload', async (req, res) => {
  const file = req.files[0]
  return { name: file.name }
})

app.get('/string', async (req, res) => {
  res.setHeader('content-type', 'text/plain; charset=utf-8')
  return 'string'
})

app.get('/empty', async (req, res) => {
  res.setHeader('content-type', 'text/plain; charset=utf-8')
  return ''
})

app.get('/number', async (req, res) => {
  res.setHeader('content-type', 'text/plain; charset=utf-8')
  return 5
})

app.get('/true', async (req, res) => {
  res.setHeader('content-type', 'text/plain; charset=utf-8')
  return true
})

app.get('/false', async (req, res) => {
  res.setHeader('content-type', 'text/plain; charset=utf-8')
  return false
})

app.any('*', async (req, res) => {
  const routes = {
    'POST:/custom': 'async (req, res) => { return { hello: "custom" } }'
  }
  const route = routes[`${req.method}:${req.path}`]
  if (route) {
    return await eval(route)(req, res)
  }
})

app.action('*', async (data, client, req) => {
  return { hello: 'world' }
})

app.action('hello', async (data, client, req) => {
  return { hello: 'hi' }
})

app.action('mutate', async (data, client, req) => {
  return { hello: client.mutate }
})

app.action('count', async (data, client, req) => {
  const count = app.websocket.server.clients.size
  return { hello: count }
})

app.action('clients', async (data, client, req) => {
  const count = app.websocket.clients.length
  return { hello: count }
})

app.action('bounce', async (data, client, req) => {
  return data
})
