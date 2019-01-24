const Sirloin = require('./index.js')

const app = new Sirloin({
  pubsub: true,
  port: 3000,
  files: 'dist', // Static files folder
  connect: async (client) => {
    client.mutate = 'mutate'
  }
})

app.log.get.info.set({ quiet: true })

/*******
 * MIDDLEWARE
 */

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

app.use(async (req, res) => {
  if (['/middleerr'].includes(req.pathname)) {
    throw new Error('middleerr')
  }
})

/*******
* ROUTES
*/

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

app.get('/query', async (req, res) => {
  return { hello: req.query.hello }
})

app.post('/query', async (req, res) => {
  return { hello: req.params.hello }
})

app.post('/error', async (req, res) => {
  throw new Error('hello error')
})

app.error(async (err, req, res) => {
  return { error: err.message }
})

app.post('/upload', async (req, res) => {
  const file = req.files[0]
  return { name: file.name }
})

app.get('/string', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  return 'string'
})

app.get('/empty', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  return ''
})

app.get('/number', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  return 5
})

app.get('/true', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  return true
})

app.get('/false', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  return false
})

app.all('*', async (req, res) => {
  const routes = {
    'POST:/custom': 'async (req, res) => { return { hello: "custom" } }'
  }
  const route = routes[`${req.method}:${req.path}`]
  if (route) {
    return await eval(route)(req, res)
  }
})

app.any('post', 'get', '/any', async (req, res) => {
  return { hello: 'any' }
})

app.get('/proxy', async () => {
  return { hello: 'proxy' }
})

app.post('/proxy', async () => {
  return { hello: 'proxy' }
})

/*******
* ACTIONS
*/

app.action('*', async (data, client) => {
  return { hello: 'world' }
})

app.action('hello', async (data, client) => {
  return { hello: 'hi' }
})

app.action('mutate', async (data, client) => {
  return { hello: client.mutate }
})

app.action('count', async (data, client) => {
  const count = app.websocket.server.clients.size
  return { hello: count }
})

app.action('clients', async (data, client) => {
  const count = app.websocket.clients.length
  return { hello: count }
})

app.action('bounce', async (data, client) => {
  return data
})

app.action('error', async (data, client) => {
  throw new Error('websocket error')
})

app.action('callback', async (data, client) => {
  await new Promise((resolve) => {
    client.send({ hello: 'moon' }, () => {
      client.send({ hello: 'callback' })
      resolve()
    })
  })
  return { hello: 'world' }
})

app.action('promise', async (data, client) => {
  await client.send({ hello: 'moon' })
  await client.send({ hello: 'callback' })
  return { hello: 'world' }
})

app.subscribe('live', async (data, client) => {
  app.websocket.clients.forEach((c) => {
    c.send(data)
  })
})

app.action('publish', async (data, client) => {
  client.publish('live', { hello: 'world' })
  return { published: true }
})

app.action('publishawait', async (data, client) => {
  await client.publish('live', { hello: 'await' })
  return { published: true }
})

app.action('publishcallback', async (data, client) => {
  client.publish('live', { hello: 'publish' }, () => {
    client.send({ hello: 'callback' })
  })
  return { published: true }
})

app.subscribe('all', async (data, client) => {
  app.websocket.clients.forEach((c) => {
    c.send(data)
  })
})

app.action('publishall', async (data, client) => {
  app.publish('all', { hello: 'publish' })
  return { published: true }
})

app.action('proxy', async (data, client) => {
  return { hello: 'proxy' }
})

app.fail(async (err, data, client) => {
  app.log.err('%s', err.message)
  return { error: err.message }
})

/*******
* LOAD BALANCER
*/

const app2 = new Sirloin({ port: 3001, proxy: true })

app2.proxy('/proxy', 'http://localhost:3000')

app2.proxy('*', 'ws://localhost:3000')

app2.proxy('/nowhere', 'ws://localhost:3000', async (req) => {
  return false
})

app2.proxy('/nowhere', 'http://localhost:3000', async (req) => {
  return { hello: 'nowhere' }
})

/*******
* HTTPS
*/
const fs = require('fs')
const app3 = new Sirloin({
  port: 3002,
  ssl: {
    key: fs.readFileSync('config/server.key'),
    cert: fs.readFileSync('config/server.crt')
  }
})

app3.get('/ssl', (req, res) => {
  return { hello: 'ssl' }
})


/*******
* HTTPS LOADBALANCER
*/
const app4 = new Sirloin({
  port: 3003,
  proxy: true,
  ssl: {
    key: fs.readFileSync('config/server.key'),
    cert: fs.readFileSync('config/server.crt')
  }
})

app4.proxy('/proxy', 'http://localhost:3000')
