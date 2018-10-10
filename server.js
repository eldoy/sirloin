const Webserver = require('./index.js')

const app = new Webserver({
  port: 3000,
  static: 'dist', // Static assets folder
  connect: async (client, req) => {
    client.mutate = 'mutate'
  }
})

app.get('/world', async (req, res) => {
  return { hello: 'world' }
})

app.post('/world', async (req, res) => {
  return { hello: 'moon' }
})

app.post('/query', async (req, res) => {
  console.log(req.query)
  return { hello: req.query.hello }
})

app.post('/upload', async (req, res) => {
  const file = req.files[0]
  return { name: file.name }
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
