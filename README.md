# FlipFlow Node.js Web Server

This extremely easy to use web server includes:

* JSON HTTP server for your APIs
* Web socket server based on actions
* Support for file uploads and post body parsing
* Fast and minimal, less than 200 lines of code
* Optional static file server
* Full async / await support
* Cors enabled by default

Zero configuration required, create an HTTP API endpoint with only 3 lines of code. If you're using web sockets, the [wsrecon](https://github.com/fugroup/wsrecon) library is recommended as you'll get support for auto-reconnect, promises and callbacks out of the box.

### INSTALL
```npm i flipflow``` or ```yarn add flipflow```

### USAGE
Supported request methods are GET, POST, PUT, DELETE, PATCH
```javascript
const Webserver = require('webserver')

// Default options shown
const app = new Webserver({
  port: 3000,
  static: 'dist' // set to false to not serve static
})

// Get request, whatever you return will be the response
app.get('/db', async (req, res) => {
  return { hello: 'world' }
})

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
Websockets are using through *actions*, the URL is irrelevant. Include *action: 'name'* in the data you are sending to the server to match your action.
```javascript
// Websocket actions work like remote function calls
app.action('hello', async (socket, req) => {
  // Return a javascript object to send to the client
  return { hello: 'world' }
})

// Example socket client setup with wsrecon
const Socket = require('wsrecon')
const socket = new Socket('ws://example.com)

// Normal socket send, matches the 'hello' action above
socket.send({ action: 'hello' })

// Use with the 'wsrecon' library to handle promises
const data = await socket.fetch({ action: 'hello' })
console.log(data) // { hello: 'world' }

// Define a '*' action to not use actions
socket.send({ name: 'Brage' }) // In the browser

app.action('*', async (socket, req) => { // On the server
  console.log(socket.message)      // { name: 'Brage' }
  socket.send({ hello: 'socket' }) // Explicit send
  return { hello: 'object' }       // Will also send what you return
})
```
Static files will be served from the 'dist' directory by default. Routes have presedence over static files. If the file path ends with just a '/', then the server will serve the 'index.html' file if it exists. Mime types are automatically added to each file to make the browser behave correctly.

See the [server.js](https://github.com/fugroup/flipflow/blob/master/server.js) file for more examples.

### LICENSE

MIT Licensed. Enjoy!