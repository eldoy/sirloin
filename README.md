![Sirloin logo](https://s3.amazonaws.com/7ino/1539200413_sirloin-logo200x128.png)

# Sirloin Node.js Web Server

This high performance easy to use web server includes:

* HTTP server for your APIs and microservices
* Support for file uploads and post body parsing
* Fast and minimal, just around 300 lines of code
* Integrated websocket server based on actions
* Static file server with compression support
* Redis pubsub for scaling your websockets
* Ping pong support terminating dead web sockets
* Full async / await support
* HTTPS over SSL support
* Cookie handling

Zero configuration required, create an HTTP API endpoint with only 3 lines of code. If you're using websockets, the [wsrecon library](https://github.com/eldoy/wsrecon) is recommended as you'll get support for auto-reconnect and automatic JSON data handling out of the box.

The websockets are based on the excellent [ws library](https://github.com/websockets/ws), pubsub is based on [ioredis](https://github.com/luin/ioredis), and the rest is pure vanilla NodeJS.

### Install
```npm i sirloin```

### HTTP Server
Supported request methods are GET, POST, PUT, DELETE and PATCH. The response and request parameters are standard Node.js HTTP server Incoming and Outgoing message instances.

The router is just based on string lookup to make it really fast.
```js
const sirloin = require('sirloin')

// Default config shown
const server = sirloin({
  // Web server port
  port: 3000,

  // Static files root directory
  // Set to false to not serve static files
  dir: 'dist',

  // Redirect to this host if no match
  host: 'https://example.com',

  // Callback for websocket connect event
  // Can be used for adding data to the websocket client
  connect: async (client) => {},

  // Redis pubsub is not enabled by default
  pubsub: undefined,

  // HTTPS over SSL support
  ssl: {
    key: '/path/to/server.key',
    cert: '/path/to/server.crt'
  }
})

// Get request, whatever you return will be the response
server.get('/db', async (req, res) => {
  req.method       // Request method
  req.path         // Request path
  req.pathname     // Request path name
  req.url          // Request URL
  req.params       // Post body parameters
  req.query        // Query parameters
  req.files        // Uploaded files
  req.cookie       // Cookie handler
  return { hello: 'world' }
})
// See the documentation on Node.js 'incoming message' (req),
// 'outgoing message' (res) and 'url' for more on what's available.

// Post request, uploads must be post requests
server.post('/upload', async (req, res) => {
  req.files // Array of uploaded files if any
  return { success: true }
})

// Use the '*' for a catch all route
server.get('*', async (req, res) => {
  if (req.path === '/custom') {
    return { hello: 'custom' }
  }
  // Return nothing or undefined to send a 404
})

// Use 'all' to match all HTTP request methods
server.all('/all', async (req, res) => {
  if (['POST', 'GET'].includes(req.method)) {
    return { status: 'OK' }
  }
})

// Use 'any' to match selected HTTP request methods
// This matches 'post' and 'get' to the /any route
server.any('post', 'get', '/any', async (req, res) => {
  return { status: 'OK' }
})

// You can also return HTML templates, strings, numbers and boolean values
server.get('/projects', async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  return '<h1>Hello world</h1>'
})
```

### Middleware
Use middleware to run a function before every request. You can return values from middleware as well and the rest of the middleware stack will be skipped.
```js
// Middleware functions are run in the order that they are added
server.use(async (req, res) => {
  res.setHeader('Content-Type', 'text/html')

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
})

// Return directly from middleware to skip further processing
server.use(async (req, res) => {
   const session = await db.session.find({ token: res.query.token })
   if (!session) {
     return { error: 'session not found' }
   }
})
```

### Websockets
Websockets are used through *actions*, the URL path is irrelevant. Include *$action: 'name'* in the data you are sending to the server to match your action. Connection handling through *ping and pong* will automatically terminate dead clients.

Websocket connections are lazy loaded and enabled only if you specify an action. All websocket actions must return Javascript objects (sent as JSON).
```js
// Websocket actions work like remote function calls
server.action('hello', async (data, client) => {
  data             // The data sent from the browser minus action
  client.id        // The id of this websocket client
  client.send()    // Use this function to send messages back to the browser
  client.req       // The request object used to connect to the websocket

  // Return a javascript object to send to the client
  return { hello: 'world' }
})

// Example socket client setup with wsrecon
const wsrecon = require('wsrecon')
const socket = await wsrecon('ws://example.com')

// Normal socket send from the browser, matches the action named 'hello'
socket.send({ $action: 'hello' })

// Get data from the web socket
socket.on('message', function(data) {
  console.log(data) // { hello: 'world' }
})

// Define a '*' action to not use actions
server.action('*', async (data, client) => {
  // Will send what you return
  return { hello: 'custom' }
})

// The client send function supports callbacks and promises
server.action('promise', async (data, client) => {
  // Unordered, the next line happens immediately
  client.send({ hello: 'send' })

  // With promise, the next line happens after this is done
  await client.send({ hello: 'promise' })

  // With callback, the next line happens immediately
  await client.send({ hello: 'promise' }, () => {
    console.log('In callback, sent it')
  })

  // ...
})

// All of the options in the ws library are supported for send
server.action('options', async (data, client) => {
  await client.send({ message: 'terminated' }, { compress: true })

  // Terminate the client when sending is done
  client.terminate()

  // ...
})
```

### Redis Pubsub
If you have more than one app server for your websockets, you need pubsub to reliably publish messages to multiple clients. With pubsub, the messages go via a [Redis server](https://redis.io), a high performance key-value store.

Sirloin has built in support for pubsub, all you need to do is to [install Redis](https://redis.io/download) and enable it in your Sirloin config:
```js
// Default config options shown
const server = sirloin({
  pubsub: {
    port: 6379,          // Redis port
    host: 'localhost',   // Redis host URL
    path: null,          // Socket path
    family: 4,           // 4 (IPv4) or 6 (IPv6)
    password: null,      // Redis password
    db: 0,               // Redis database
    channel: 'messages'  // Subscription channel
  }
})

// To use the default options, this is all you need
// Make sure Redis is running before starting your application
const server = sirloin({ pubsub: true }) // or pubsub: {}

// First subscribe to a function
server.subscribe('live', async (data, client) => {
  // Publish data to all clients except publisher (client)
  server.websocket.clients.forEach(c => {
    if (client.id !== c.id) {
      c.send(data)
    }
  })
})

// Use the 'publish' function to publish messages to multiple clients
server.action('publish', async (data, client) => {
  // This will call the subscribed function named 'live' on every app server
  client.publish('live', { hello: 'world' })

  // Publish to all without client, in case you don't have it
  server.pubsub.publish('live', { hello: 'all' })
})

// The publish function works with await
await client.publish('live', { hello: 'world' })

// ... and callbacks
client.publish('live', { hello: 'world' }, () => {
  // Publish is done, notify the publisher
  client.send({ published: true })
})
```
Pubsub is disabled by default, remove the config or set to 'false' to send messages directly to the socket.

### API & Configuration
The server object contains functions and properties that are useful as well:
```js
server.http                        // The HTTP server reference
server.websocket                   // The Websocket server reference
server.websocket.clients           // The connected clients as an array
server.pubsub                      // The pubsub connection info
server.pubsub.channel              // The current pubsub channel name
server.pubsub.publisher            // The publishing pubsub connection
server.pubsub.subscriber           // The subscribing pubsub connection
server.config                      // The active config for the server

// For each client you can send data to the browser
server.websocket.clients.forEach(client => {
  client.send({ hello: 'world' })
})

// Find the client with the 'id' in id and send some data to it
const client = server.websocket.clients.find(c => c.id === id)
client.send({ data: { hello: 'found' } })
```

### Static File Server
Static files will be served from the 'dist' directory by default. Routes have presedence over static files. If the file path ends with just a '/', then the server will serve the 'index.html' file if it exists.
```js
// Set the static file directory via the 'dir' option, default is 'dist'
const server = sirloin({ dir: 'dist' })

// Change it to the name of your static files directory
const server = sirloin({ dir: 'public' })

// Set it to false to disable serving of static files
const server = sirloin({ dir: false })
```
If the given directory doesn't exist static files will be disabled automatically.

Mime types are automatically added to each file to make the browser behave correctly. The server enables browser caching by using the Last-Modified header returning a 304 response if the file is fresh. This speeds up delivery a lot.

### Error Handling
Errors can be caught with ```try catch``` inside of middleware, routes and actions.
```js
server.get('/crash', async (req, res) => {
  try {
    const user = await db.user.first()
  } catch (e) {
    console.log(e.message)
    return { error: 'find user crashed' }
  }
})
```
You can also collect errors in special routes and actions. The 'err' argument is a normal javascript Error instance.
```js
// For middleware and http routes use 'error'
server.error(async (err, req, res) => {
  return { error: err.message }
})

// For websocket actions use 'fail'
server.fail(async (err, data, client) => {
  return { error: err.message }
})

// Trigger error from middleware, will go to 'error' if defined
server.use(async (req, res) => {
  throw new Error('middleware error!')
})

// Trigger error from http route, will go to 'error' if defined
server.post('/db', async (req, res) => {
  throw new Error('http error!')
})

// Trigger error from websocket action, will go to 'fail' if defined
server.action('db', async (data, client) => {
  throw new Error('websocket error!')
})
```

### Examples of Use
Here are a few examples showing how easy to use Sirloin can be:
```js
// File server running on port 3000 (yeah, only one line of code)
require('sirloin')()

// JSON API endpoint without routes (middleware only)
const server = require('sirloin')()
server.use(async (req, res) => {
  return { hello: 'world' }
})

// JSON API endpoint with routes
const sirloin = require('sirloin')
const server = sirloin()
server.get('/', async (req, res) => {
  return { hello: 'world' }
})

// JSON Websocket endpoint
const sirloin = require('sirloin')
const server = sirloin()
server.action('hello', async (data, client) => {
  return { hello: 'world' }
})
```
See the [dev.js](https://github.com/eldoy/sirloin/blob/master/dev.js) file for more examples.

### License

MIT Licensed. Enjoy!
