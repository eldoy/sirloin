![Sirloin logo](https://s3.amazonaws.com/7ino/1539200413_sirloin-logo200x128.png)

# Sirloin Node.js Web Server

This high performance, extremely easy to use web server includes:

* HTTP server for your APIs and microservices
* Support for file uploads and post body parsing
* Fast and minimal, just around 500 lines of code
* Integrated websocket server based on actions
* Redis pubsub for scaling your websockets
* Reverse proxy load balancer support
* Optional static file server
* Cors enabled out of the box
* Full async / await support
* Docker friendly

Zero configuration required, create an HTTP API endpoint with only 3 lines of code. If you're using websockets, the [wsrecon library](https://github.com/fugroup/wsrecon) is recommended as you'll get support for auto-reconnect, promises and callbacks out of the box.

The websockets are based on the excellent [ws library](https://github.com/websockets/ws), pubsub is based on [ioredis](https://github.com/luin/ioredis), reverse proxy is based on [http-proxy](https://github.com/nodejitsu/node-http-proxy), the rest is pure vanilla NodeJS.

*Sirloin is considerably faster than Express and Hapi.*

### INSTALL
```npm i sirloin``` or ```yarn add sirloin```

Using the included binary you can start a web server in any directory.
To install the binary, do ```npm i -g sirloin``` or ```yarn global add sirloin```.
```
// Start a web server running on port 3000 from the 'dist' directory
sirloin

// Start a web server from another directory and port
sirloin -p 3001 -d ~/apps/public

// Start a web server from the directory you are in
sirloin -d .

// The -d option can be dropped as a short cut
sirloin ~/src/web/dist
```

### HTTP SERVER
Supported request methods are GET, POST, PUT, DELETE and PATCH. The response and request parameters are standard Node.js HTTP server Incoming and Outgoing message instances.

The router is just based on string lookup to make it really fast.
```javascript
const Sirloin = require('sirloin')

// Default config shown
const app = new Sirloin({
  // Web server port
  port: 3000,

  // Static files root directory
  // Set to false to not serve static files
  files: 'dist',

  // Callback for websocket connect event
  // Can be used for adding data to the websocket client
  connect: async (client) => {},

  // Redis pubsub is not enabled by default
  pubsub: undefined
})

// Get request, whatever you return will be the response
app.get('/db', async (req, res) => {
  req.method       // Request method
  req.path         // Request path
  req.pathname     // Request path name
  req.url          // Request URL
  req.params       // Post body parameters
  req.query        // Query parameters
  req.files        // Uploaded files
  return { hello: 'world' }
})
// See the documentation on Node.js 'incoming message' (req),
// 'outgoing message' (res) and 'url' for more on what's available.

// Post request, uploads must be post requests
app.post('/upload', async (req, res) => {
  req.files // Array of uploaded files if any
  return { success: true }
})

// Use the '*' for a catch all route
app.get('*', async (req, res) => {
  if (req.path === '/custom') {
    return { hello: 'custom' }
  }
  // Return nothing or undefined to send a 404
})

// Use 'all' to match all HTTP request methods
app.all('/all', async (req, res) => {
  if (['POST', 'GET'].includes(req.method)) {
    return { status: 'OK' }
  }
})

// Use 'any' to match selected HTTP request methods
// This matches 'post' and 'get' to the /any route
app.any('post', 'get', '/any', async (req, res) => {
  return { status: 'OK' }
})

// You can also return HTML templates, strings, numbers and boolean values
app.get('/projects', async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  return '<h1>Hello world</h1>'
})
```

### MIDDLEWARE
Use middleware to run a function before every request. You can return values from middleware as well and the rest of the middleware stack will be skipped.
```javascript
// Middleware functions are run in the order that they are added
app.use(async (req, res) => {
  res.setHeader('Content-Type', 'text/html')
})

// Return directly from middleware to skip further processing
app.use(async (req, res) => {
   const session = await db.session.find({ token: res.query.token })
   if (!session) {
     return { error: 'session not found' }
   }
})
```

### WEBSOCKETS
Websockets are used through *actions*, the URL path is irrelevant. Include *action: 'name'* in the data you are sending to the server to match your action. Connection handling through *ping and pong* will automatically terminate dead clients.

Websocket connections are lazy loaded and enabled only if you specify an action. All websocket actions must return Javascript objects (sent as JSON).
```javascript
// Websocket actions work like remote function calls
app.action('hello', async (data, client) => {
  data             // The data sent from the browser minus action
  client.id        // The id of this websocket client
  client.send()    // Use this function to send messages back to the browser
  client.req       // The request object used to connect to the websocket
  client.websocket // The app websocket object

  // Return a javascript object to send to the client
  return { hello: 'world' }
})

// Example socket client setup with wsrecon
const Socket = require('wsrecon')
const socket = new Socket('ws://example.com')

// Normal socket send from the browser, matches the action named 'hello'
socket.send({ action: 'hello' })

// Use with the 'wsrecon' library to use promises
const data = await socket.fetch({ action: 'hello' })
console.log(data) // { hello: 'world' }

// Define a '*' action to not use actions
app.action('*', async (data, client) => {
  return { hello: 'custom' }       // Will send what you return
})

// The client send function supports callbacks and promises
app.action('promise', async (data, client) => {
  // Unordered, the next line happens immediately
  client.send({ hello: 'send'})

  // With promise, the next line happens after this is done
  await client.send({ hello: 'promise'})

  // With callback, the next line happens immediately
  await client.send({ hello: 'promise'}, () => {
    app.log.info('In callback, sent it')
  })

  // ...
})

// All of the options in the ws library are supported for send
app.action('options', async (data, client) => {
  await client.send({ message: 'terminated'}, { compress: true })

  // Terminate the client when sending is done
  client.terminate()

  // ...
})
```
### REDIS PUBSUB
If you have more than one app server for your websockets, you need pubsub to reliably publish messages to multiple clients. With pubsub, the messages go via a [Redis server](https://redis.io), a high performance key-value store.

Sirloin has built in support for pubsub, all you need to do is to [install Redis](https://redis.io/download) and enable it in your Sirloin config:
```javascript
// Default config options shown
const app = new Sirloin({
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
const app = new Sirloin({ pubsub: true }) // or pubsub: {}

// First subscribe to a function
app.subscribe('live', async (data, client) => {
  // Publish data to all clients except publisher (client)
  app.websocket.clients.forEach((c) => {
    if (client.id !== c.id) {
      c.send(data)
    }
  })
})

// Use the 'publish' function to publish messages to multiple clients
app.action('publish', async (data, client) => {
  // This will call the subscribed function named 'live' on every app server
  client.publish('live', { hello: 'world' })

  // Publish to all without client, in case you don't have it
  app.publish('live', { hello: 'all' })
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

### API & CONFIGURATION
The app object contains functions and properties that are useful as well:
```javascript
app.config                      // The active config for the app
app.http                        // The HTTP server reference
app.http.server                 // The Node.js HTTP server instance
app.websocket                   // The Websocket server reference
app.websocket.server            // The ws Websocket server instance
app.websocket.server.clients    // The connected clients as a set
app.websocket.clients           // The connected clients as an array
app.websocket.pubsub            // The pubsub object
app.websocket.pubsub.hub        // The pubsub hub handling subscriptions
app.websocket.pubsub.connected  // Whether pubsub is connected or not
app.websocket.pubsub.channel    // The channel to publish messages on
app.websocket.pubsub.options    // The Redis pubsub options

// For each client you can send data to the browser
app.websocket.clients.forEach((client) => {
  client.send({ hello: 'world' })
})

// Find the client with the 'id' in _id and send some data to it
const client = app.websocket.clients.find(c => c.id === _id)
client.send({ data: { hello: 'found' } })
```
### STATIC FILE SERVER
Static files will be served from the 'dist' directory by default. Routes have presedence over static files. If the file path ends with just a '/', then the server will serve the 'index.html' file if it exists.
```javascript
// Set the static file directory via the 'files' option, default is 'dist'
const app = new Sirloin({ files: 'dist' })

// Change it to the name of your static files directory
const app = new Sirloin({ files: 'public' })

// Set it to false to disable serving of static files
const app = new Sirloin({ files: false })
```
If the given directory doesn't exist static files will be disabled automatically.

Mime types are automatically added to each file to make the browser behave correctly.

### LOGGING
Logging is done using the ```app.log``` command. It is an instance of [Rainlog](https://github.com/fugroup/rainlog). You can log to console as well as to file. Rainlog supports multiple loggers, and you can optionally add styles to each logger.
```javascript
// Log to console with the 'info' logger
app.log.info('hello')

// Log to console with the 'err' logger
app.log.err('hello')

// Set styles for your logger
// You can combine styles from the 'chalk' library as you please.
app.log.get.info.set({ style: 'green.bold.underline' })

// Default styles are 'green' for info and 'red' for err.
```
Check out the documentation on [Rainlog](https://github.com/fugroup/rainlog) for more info on how to use it and set it up.

### ERROR HANDLING
Errors can be caught with ```try catch``` inside of middleware, routes and actions.
```javascript
app.get('/crash', async (req, res) => {
  try {
    const user = await db.user.first()
  } catch (e) {
    app.log.err(e.message)
    return { error: 'find user crashed' }
  }
})
```
You can also collect errors in special routes and actions. The 'err' argument is a normal javascript Error instance.
```javascript
// For middleware and http routes use 'error'
app.error(async (err, req, res) => {
  return { error: err.message }
})

// For websocket actions use 'fail'
app.fail(async (err, data, client) => {
  return { error: err.message }
})

// Trigger error from middleware, will go to 'error' if defined
app.use(async (req, res) => {
  throw new Error('middleware error!')
})

// Trigger error from http route, will go to 'error' if defined
app.post('/db', async (req, res) => {
  throw new Error('http error!')
})

// Trigger error from websocket action, will go to 'fail' if defined
app.action('db', async (data, client) => {
  throw new Error('websocket error!')
})
```
### REVERSE PROXY LOAD BALANCER
Sirloin has built-in support for reverse proxying so you can use it as a load balancer instead of Nginx, Haproxy or Traefik. You entire application stack can now be pure Javascript.
```javascript
// Enable proxy mode
const app = new Sirloin({ proxy: true })

// Forward all http requests to http://localhost:8080
app.proxy('*', 'http://localhost:8080')

// Forward all websocket requests to 'http://localhost:8081'
app.proxy('*', 'ws://localhost:8081')

// Forward all requests to /db to http://195.23.43.5:8082'
app.proxy('/db', 'http://195.23.43.5:8082')

// Intercept all http traffic and return data
app.proxy('*', 'http://localhost:8080', (req) => {
  if (req.pathname === '/db') {
    return { error: 'Access denied' }
  }
  // Return nothing or undefined to proxy the request normally
})

// Intercept all websocket traffic
app.proxy('*', 'http://localhost:8080', (req) => {
  // Websockets don't return data, the socket is simply destroyed
  // if you return anything else but undefined
  if (req.pathname === '/db') {
    return false
  }
})
```
When in proxy mode, normal http will be ignored. The performance of the reverse proxy is very good, try it out!

### EXAMPLES OF USE
Here's a few examples showing how easy to use Sirloin can be:
```javascript
// File server running on port 3000 (yeah, only one line of code)
new (require('sirloin'))()

// JSON API endpoint without routes (middleware only)
const app = new (require('sirloin'))()
app.use(async (req, res) => {
  return { hello: 'world' }
})

// JSON API endpoint with routes
const app = new (require('sirloin'))()
app.get('/', async (req, res) => {
  return { hello: 'world' }
})

// JSON Websocket endpoint
const app = new (require('sirloin'))()
app.action('hello', async (data, client) => {
  return { hello: 'world' }
})
```
See the [server.js](https://github.com/fugroup/sirloin/blob/master/server.js) file for more examples.

### LICENSE

MIT Licensed. Enjoy!
