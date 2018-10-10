![Sirloin logo](https://s3.amazonaws.com/7ino/1539200413_sirloin-logo200x128.png)

# Sirloin Node.js Web Server

This extremely easy to use web server includes:

* JSON HTTP server for your APIs
* Web socket server based on actions
* Support for file uploads and post body parsing
* Fast and minimal, just around 200 lines of code
* Optional static file server
* Full async / await support
* Cors enabled by default

Zero configuration required, create an HTTP API endpoint with only 3 lines of code. If you're using websockets, the [wsrecon](https://github.com/fugroup/wsrecon) library is recommended as you'll get support for auto-reconnect, promises and callbacks out of the box.

The websockets are based on the excellent (ws lib)[https://github.com/websockets/ws], and have very few other dependencies.

Sirloin is up to 30% faster than Express and Hapi, and even faster than Koa.

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
Websockets are using through *actions*, the URL is irrelevant. Include *action: 'name'* in the data you are sending to the server to match your action. Connection handling through *ping and pong* will automatically terminate dead clients.
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
The app object contains functions and properties that are useful as well:
```javascript
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

Static files will be served from the 'dist' directory by default. Routes have presedence over static files. If the file path ends with just a '/', then the server will serve the 'index.html' file if it exists.

Mime types are automatically added to each file to make the browser behave correctly.

See the [server.js](https://github.com/fugroup/sirloin/blob/master/server.js) file for more examples.

### LICENSE

MIT Licensed. Enjoy!