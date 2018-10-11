TODO

* [ ] Built in support for redis pub-sub for web sockets
* [ ] HTTP caching for static files (last modified, etags)
* [ ] Lazy load web socket connection, don't load if not in use
* [ ] Middleware support: app.use((req, res) => {}), load to array and run. Mutates.
* [ ] Make options requests customizable?
* [ ] Test with empty file for files
* [ ] Test with file extension with multiple dots: hello.tar.gz, jquery.min.js
* [ ] No support for strings, only JSON
* [ ] Use mime type lookup without using path?