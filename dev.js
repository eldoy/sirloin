const sirloin = require('./index.js')

const server = sirloin({
  pubsub: true,
  port: 3000,
  files: 'dist', // Static files folder
  connect: async (client) => {
    client.mutate = 'mutate'
  },

  // Uncomment to force this host:
  // host: 'https://localhost'

  // Uncomment to enable SSL:
  // ssl: {
  //   key: './config/server.key',
  //   cert: './config/server.crt'
  // }
})

/*******
 * MIDDLEWARE
 */

server.use(async (req, res) => {
  if (['/middleware', '/multiple'].includes(req.pathname)) {
    res.setHeader('Content-Type', 'text/html')
  }
})

server.use(async (req, res) => {
  if (['/multiple'].includes(req.pathname)) {
    res.setHeader('Content-Language', 'no-NO')
  }
})

server.use(async (req, res) => {
  if (['/middleret'].includes(req.pathname)) {
    return { hello: 'middleret'}
  }
})

server.use(async (req, res) => {
  if (['/middleerr'].includes(req.pathname)) {
    throw new Error('middleerr')
  }
})

/*******
* ROUTES
*/

server.get('/middleware', async (req, res) => {
  return { hello: 'middleware' }
})

server.get('/multiple', async (req, res) => {
  return { hello: 'multiple' }
})

server.get('/world', async (req, res) => {
  return { hello: 'world' }
})

server.post('/world', async (req, res) => {
  return { hello: 'moon' }
})

server.put('/update', async (req, res) => {
  return { hello: 'updated' }
})

server.delete('/remove', async (req, res) => {
  return { hello: 'removed' }
})

server.patch('/patch', async (req, res) => {
  return { hello: 'patched' }
})

server.get('/query', async (req, res) => {
  return { hello: req.query.hello }
})

server.post('/query', async (req, res) => {
  return { hello: req.params.hello }
})

server.post('/error', async (req, res) => {
  throw new Error('hello error')
})

server.error(async (err, req, res) => {
  return { error: err.message }
})

server.post('/upload', async (req, res) => {
  const file = req.files[0]
  return { name: file.name }
})

server.get('/string', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  return 'string'
})

server.get('/empty', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  return ''
})

server.get('/number', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  return 5
})

server.get('/true', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  return true
})

server.get('/false', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  return false
})

server.all('*', async (req, res) => {
  const routes = {
    'POST:/custom': 'async (req, res) => { return { hello: "custom" } }'
  }
  const route = routes[`${req.method}:${req.path}`]
  if (route) {
    return await eval(route)(req, res)
  }
})

server.any('post', 'get', '/any', async (req, res) => {
  return { hello: 'any' }
})

server.get('/cookie', async (req, res) => {
  req.cookie('name', 'hello')
  return {}
})

/*******
* ACTIONS
*/

server.action('*', async (data, client) => {
  return { hello: 'world' }
})

server.action('hello', async (data, client) => {
  return { hello: 'hi' }
})

server.action('mutate', async (data, client) => {
  return { hello: client.mutate }
})

server.action('count', async (data, client) => {
  const count = server.websocket.clients.size
  return { hello: count }
})

server.action('clients', async (data, client) => {
  const count = [...server.websocket.clients].length
  return { hello: count }
})

server.action('bounce', async (data, client) => {
  return data
})

server.action('error', async (data, client) => {
  throw new Error('websocket error')
})

server.action('callback', async (data, client) => {
  await new Promise((resolve) => {
    client.send({ hello: 'moon' }, () => {
      client.send({ hello: 'callback' })
      resolve()
    })
  })
  return { hello: 'world' }
})

server.action('promise', async (data, client) => {
  await client.send({ hello: 'moon' })
  await client.send({ hello: 'callback' })
  return { hello: 'world' }
})

server.subscribe('live', async (data, client) => {
  server.websocket.clients.forEach((c) => {
    c.send(data)
  })
})

server.action('publish', async (data, client) => {
  client.publish('live', { hello: 'world' })
  return { published: true }
})

server.action('publishawait', async (data, client) => {
  await client.publish('live', { hello: 'await' })
  return { published: true }
})

server.action('publishcallback', async (data, client) => {
  client.publish('live', { hello: 'publish' }, () => {
    client.send({ hello: 'callback' })
  })
  return { published: true }
})

server.subscribe('all', async (data, client) => {
  server.websocket.clients.forEach((c) => {
    c.send(data)
  })
})

server.action('publishall', async (data, client) => {
  server.publish('all', { hello: 'publish' })
  return { published: true }
})

server.fail(async (err, data, client) => {
  console.log('%s', err.message)
  return { error: err.message }
})

/*******
* WEB
*/

const server2 = sirloin({ port: 3001 })

/*******
* HTTPS
*/

const server3 = sirloin({
  port: 3002,
  ssl: {
    key: 'config/server.key',
    cert: 'config/server.crt'
  }
})

server3.get('/ssl', (req, res) => {
  return { hello: 'ssl' }
})