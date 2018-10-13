#!/usr/bin/env node

// Get args
let args = process.argv.slice(2).map(x => x.toLowerCase().trim())

// Extract options
const options = { port: 3000, files: 'dist' }
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '-p': options['port'] = parseInt(args[i + 1]); break
    case '-d': options['files'] = args[i + 1]
  }
}
console.log('%o', options)

// Start web server
new (require('../index.js'))(options)
