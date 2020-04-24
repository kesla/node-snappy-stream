var crc32c = require('fast-crc32c').calculate
var bufferAlloc = require('buffer-alloc')

module.exports = function (value) {
      var x = crc32c(value)
      var result = bufferAlloc(4)

      result.writeUInt32LE(((((x >> 15) | (x << 17)) + 0xa282ead8)) >>> 0, 0, true)

      return result
    }