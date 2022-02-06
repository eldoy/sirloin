// Run api functions
module.exports = async function run(fn, handler, ...args) {
  try {
    return await fn(...args)
  } catch(e) {
    if (handler) {
      return await handler(e, ...args)
    } else {
      throw e
    }
  }
}