# Sirloin Node.js Web Server

This extremely easy to use web server includes:

* JSON HTTP server for your APIs
* Web socket server based on actions
* Support for file uploads and post body parsing
* Fast and minimal, less than 200 lines of code
* Optional static file server
* Full async / await support
* Cors enabled by default

Zero configuration required, create an HTTP API endpoint with only 3 lines of code. If you're using websockets, the [wsrecon](https://github.com/fugroup/wsrecon) library is recommended as you'll get support for auto-reconnect, promises and callbacks out of the box.

### INSTALL
```npm i sirloin``` or ```yarn add sirloin```

### USAGE
Supported request methods are GET, POST, PUT, DELETE and PATCH. The response and request parameters are standard Node.js HTTP server instances.
```javascript
const Sirloin = require('sirloin')

// Default options shown
const app = new Sirloin({
  // Web server port
  port: 3000,
  // Static assets root directory
  // set to false to not serve static files
  static: 'dist',
  // Callback for websocket connect event
  // Can be used for adding data to the websocket connection
  connect: async (connection, req) => {}
})

// Get request, whatever you return will be the response
app.get('/db', async (req, res) => {
  req.method       // Request method
  req.path         // Request path
  req.pathname     // Request path name
  req.url          // Request URL
  req.params       // Post body parameters
  req.query        // Query parameters
  return { hello: 'world' }
})
// See the documentation on Incoming message and uri for more info.

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
  // Return nothing or false to send a 404
})

// Use 'any' to match all HTTP request methods
app.any('/both', async (req, res) => {
  if (['POST', 'GET'].includes(req.method)) {
    return { status: 'OK' }
  }
})
```
Websockets are using through *actions*, the URL is irrelevant. Include *action: 'name'* in the data you are sending to the server to match your action. Connection handling through *ping and pong* will automatically terminate dead connections.
```javascript
// Websocket actions work like remote function calls
app.action('hello', async (message, socket, req) => {
  message.data     // Contains whatever you sent from the browser minus the action
  message.action   // The name of the action, here 'hello'
  message.id       // Internal id used for promises in the browser

  socket.send({})  // Use this function to send messages back to the browser
  socket.client    // The raw websocket client
  socket.id        // The id of the raw websocket client
  socket.message   // The message object above

  // Return a javascript object to send to the client
  return { hello: 'world' }
})

// Example socket client setup with wsrecon
const Socket = require('wsrecon')
const socket = new Socket('ws://example.com')

// Normal socket send, matches the 'hello' action above
socket.send({ action: 'hello' })

// Use with the 'wsrecon' library to handle promises
const data = await socket.fetch({ action: 'hello' })
console.log(data) // { hello: 'world' }

// Define a '*' action to not use actions
app.action('*', async (message, socket, req) => {
  return { hello: 'custom' }       // Will send what you return
})
```
The app object contains functions and properties that are useful as well:
```javascript
app.http                      // The HTTP server reference
app.http.server               // The Node.js HTTP server instance
app.websocket                 // The Websocket server reference
app.websocket.server          // The ws Websocket server instance
app.websocket.server.clients  // The raw connected clients as a Set
app.websocket.sockets         // All the connected sockets as an array

// For each socket in sockets you can send data to the browser
app.websocket.sockets.forEach((socket) => {
  socket.send({ hello: 'world' })
})

// Find the socket with the 'id' in _id and send some data to it
const socket = app.websocket.sockets.find(s => s.id === _id)
socket.send({ data: { hello: 'found' } })
```

Static files will be served from the 'dist' directory by default. Routes have presedence over static files. If the file path ends with just a '/', then the server will serve the 'index.html' file if it exists.

Mime types are automatically added to each file to make the browser behave correctly.

See the [server.js](https://github.com/fugroup/sirloin/blob/master/server.js) file for more examples.

### LICENSE

MIT Licensed. Enjoy!