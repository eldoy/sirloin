TODO

* [ ] Built in support for redis pub-sub for web sockets
* [ ] HTTP caching for static files (last modified, etags)
* [ ] Lazy load web socket connection, don't load if not in use
* [ ] Middleware support: app.use((req, res) => {}), load to array and run. Mutates.
* [ ] Completely wrap ws connection object to avoid having to do JSON.stringify on send
  - socket.clients should also be wrapped
* [ ] Make an app.clients which maps this.websocket.clients
  - New Client class with send for stringify
    - Add terminate function with optional error message for send
  - New Message class for messages
  - message, client, req for actions
  - rename connection to client
  - return ws.terminate() -> connection.terminate()
* [ ] Support http return string (text/html)