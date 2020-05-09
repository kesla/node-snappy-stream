var crc32c = require('fast-crc32c').calculate
var bufferAlloc = require('buffer-alloc')

module.exports = function (value) {
  var x = crc32c(value)
  var result = bufferAlloc(4)

  // As defined in section 3 of https://github.com/google/snappy/blob/master/framing_format.txt
  // And other implementations for reference:
  // Go: https://github.com/golang/snappy/blob/2e65f85255dbc3072edf28d6b5b8efc472979f5a/snappy.go#L97
  // Python: https://github.com/andrix/python-snappy/blob/602e9c10d743f71bef0bac5e4c4dffa17340d7b3/snappy/snappy.py#L70
  // Mask the right hand to (32 - 17) = 15 bits -> 0x7fff, to keep correct 32 bit values.
  // Shift the left hand with >>> for correct 32 bit intermediate result.
  // Then final >>> 0 for 32 bits output
  result.writeUInt32LE(((((x >>> 15) | ((x & 0x7fff) << 17)) + 0xa282ead8)) >>> 0, 0, true)

  return result
}