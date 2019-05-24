class Config {
  set(data) {
    for(const key in data) {
      this[key] = data[key]
    }
  }
}

module.exports = new Config()
