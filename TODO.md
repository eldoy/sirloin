TODO

* [ ] Make sirloin binary with pkg and global npm install. Include in brew?
* [ ] HTTP caching for static files (last modified, etags)
* [ ] Define methods: every(['post', 'get'], '/postget', async () => {})
* [x] Error handling, 500 action? app.error(async (err, req, res) => {})
* [x] Automatically set files option to false if directory doesn't exist
* [x] Built in support for redis pub-sub for web sockets
* [x] Move listen to separate function to do print port
* [x] Tool for logger with NODE_ENV
* [x] Action has no print log
* [x] Return from middleware directly
* [x] Lazy load web socket connection, don't load if not in use
* [x] Middleware support: app.use((req, res) => {}), load to array and run. Mutates.
* [-] Make options requests customizable?
* [x] Test with empty file for files
* [x] Test with file extension with multiple dots: hello.tar.gz, jquery.min.js
* [x] Support for strings instead of JSON
* [x] Use mime type lookup without using path?