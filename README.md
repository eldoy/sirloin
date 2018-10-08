* Use bparse to add params and files to req
* Convert router code to work server side, map to function
* CORS always enabled
* Automatic static assets
* WS Ping-pong-terminate automatic


const Webserver = require('webserver')

const app = new Webserver({
  port: 3000,
  static: 'dist' // set to false to not serve static
})

app.get('/db', async (req, res) => {

})

app.ws('/db', async (ws, req) => {

})

app.get('*', async (req, res) => {
  // Custom config
  app.route({
    '/hello': 'console.log("hello")' // string or function, will be wrapped in async function(req, res), eval for string
  })
})

app.start()