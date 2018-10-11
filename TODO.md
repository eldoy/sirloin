TODO

* [ ] Built in support for redis pub-sub for web sockets
* [ ] HTTP caching for static files (last modified, etags)
* [x] Lazy load web socket connection, don't load if not in use
* [x] Middleware support: app.use((req, res) => {}), load to array and run. Mutates.
* [-] Make options requests customizable?
* [x] Test with empty file for files
* [x] Test with file extension with multiple dots: hello.tar.gz, jquery.min.js
* [x] Support for strings instead of JSON
* [x] Use mime type lookup without using path?