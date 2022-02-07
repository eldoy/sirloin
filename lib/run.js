// Run api functions
module.exports = async function(fn, err, ...args) {
  try {
    return await fn(...args)
  } catch(e) {
    if (err) {
      return await err(e, ...args)
    } else {
      throw e
    }
  }
}
