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

app.post('/upload', async (req, res) => {
  const file = req.files[0]
  return { name: file.name }
})

app.action('*', async (socket, req) => {
  return { hello: 'world' }
})

app.action('hello', async (socket, req) => {
  return { hello: 'hi' }
})

app.action('mutate', async (socket, req) => {
  return { hello: socket.client.mutate }
})

app.action('count', async (socket, req) => {
  const count = app.websocket.websocket.clients.size
  console.log('hello:', count)
  return { hello: count }
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
