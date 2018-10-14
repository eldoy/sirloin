# TODO

* [ ] Binary single parameter file location (optional -d)
* [x] Replace app.log / tools.log with rainlog
* [x] HEAD request support
* [x] Make sirloin binary
* [x] HTTP caching for static files (last modified, etags)
* [x] Define methods: any('post', 'get', '/postget', async () => {})
* [x] Error handling, 500 action? app.error(async (err, req, res) => {})
* [x] Automatically set files option to false if directory doesn't exist
* [x] Built in support for redis pub-sub for web sockets
* [x] Move listen to separate function to do print port
* [x] Tool for logger with NODE_ENV
* [x] Action has no print log
* [x] Return from middleware directly
* [x] Lazy load web socket connection, don't load if not in use
* [x] Middleware support: app.use((req, res) => {}), load to array and run. Mutates.
* [x] Test with empty file for files
* [x] Test with file extension with multiple dots: hello.tar.gz, jquery.min.js
* [x] Support for strings instead of JSON
* [x] Use mime type lookup without using path?