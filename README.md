![Sirloin logo](https://s3.amazonaws.com/7ino/1539200413_sirloin-logo200x128.png)

# Sirloin Node.js Web Server

This high performance, extremely easy to use web server includes:

* JSON HTTP server for your APIs
* Web socket server based on actions
* Support for file uploads and post body parsing
* Fast and minimal, less than 300 lines of code
* Redis pubsub support for scaling your websockets
* Optional static file server
* Full async / await support
* Cors enabled by default

Zero configuration required, create an HTTP API endpoint with only 3 lines of code. If you're using websockets, the [wsrecon library](https://github.com/fugroup/wsrecon) is recommended as you'll get support for auto-reconnect, promises and callbacks out of the box.

The websockets are based on the excellent [ws library](https://github.com/websockets/ws), and have very few other dependencies.

*Sirloin is up to 30% faster than Express and Hapi, and also faster than Koa.*

### INSTALL
```npm i sirloin``` or ```yarn add sirloin```

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
  connect: async (client, req) => {}
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

// Use 'any' to match all HTTP request methods
app.any('/both', async (req, res) => {
  if (['POST', 'GET'].includes(req.method)) {
    return { status: 'OK' }
  }
})

// You can also return HTML, strings, numbers and boolean values
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
app.action('hello', async (data, client, req) => {
  data             // The data sent from the browser minus action
  client.id        // The id of this websocket client
  client.send()    // Use this function to send messages back to the browser
  req              // The request object used to connect to the websocket

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
app.action('*', async (data, client, req) => {
  return { hello: 'custom' }       // Will send what you return
})
```
### REDIS PUBSUB
If you have more than one app server for your websockets, you need pubsub to reliably send messages back to the browser. With pubsub, the messages go via a [Redis server](https://redis.io), a high performance database server.

Sirloin has built in support for pubsub, all you need to do is to [install Redis](https://redis.io/download) and enable it in your Sirloin config:
```javascript
// Default config options shown
const app = new Sirloin({
  pubsub: {
    port: 6379,          // Redis port
    host: '127.0.0.1',   // Redis host URL
    family: 4,           // 4 (IPv4) or 6 (IPv6)
    password: 'auth',    // Redis password
    db: 0                // Redis database
  }
})

// To use the default options, this is all you need
// Make sure Redis is running before starting your application
const app = new Sirloin({ pubsub: {} })
```
Pubsub is disabled by default, remove the config or set to 'false' to send messages directly to the socket.

### API & CONFIGURATION
The app object contains functions and properties that are useful as well:
```javascript
app.config                    // The active config for the app
app.http                      // The HTTP server reference
app.http.server               // The Node.js HTTP server instance
app.websocket                 // The Websocket server reference
app.websocket.server          // The ws Websocket server instance
app.websocket.server.clients  // The connected clients as a set
app.websocket.clients         // The connected clients as an array

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

Mime types are automatically added to each file to make the browser behave correctly.

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
app.action('hello', async (req, res) => {
  return { hello: 'world' }
})
```
See the [server.js](https://github.com/fugroup/sirloin/blob/master/server.js) file for more examples.

### LICENSE

MIT Licensed. Enjoy!
