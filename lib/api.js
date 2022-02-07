const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

module.exports = function(state) {

  const api = {}

  // Generate verb functions
  for (const m of METHODS) {
    state.routes[m] = {}
    api[m.toLowerCase()] = function(path, fn) {
      state.routes[m][path] = fn
    }
  }

  // Match specific methods
  api.all = function(path, fn, methods = METHODS) {
    for (const m of methods) {
      api[m.toLowerCase()](path, fn)
    }
  }

  // Match any method
  api.any = function(...args) {
    const [fn, path] = args.reverse()
    api.all(path, fn)
  }

  // Use middleware
  api.use = function(fn) {
    state.middleware.push(fn)
  }

  // Match action name
  api.action = function(name, fn) {
    state.actions[name] = fn
  }

  // Subscribe to publish
  api.subscribe = function(name, fn) {
    state.handlers[name] = fn
  }

  // HTTP error
  api.error = function(fn) {
    state.handlers.error = fn
  }

  // Websocket fail
  api.fail = function(fn) {
    state.handlers.fail = fn
  }

  return api
}
