var crc32c = require('fast-crc32c').calculate

module.exports = function (value) {
      var x = crc32c(value)
        , buffer = new Buffer(4)

      buffer.writeUInt32LE(((((x >> 15) | (x << 17)) + 0xa282ead8)) >>> 0, 0, true)

      return buffer
    }