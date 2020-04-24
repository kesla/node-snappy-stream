var checksum = require("../lib/checksum");
var fs = require("fs");
var join = require("path").join;
var test = require("tap").test;
var bufferAlloc = require('buffer-alloc')

function bufferToArray(buffer) {
  var array = new Array(buffer.length);
  for (var i = 0; i < buffer.length; ++i) {
    array[i] = buffer[i];
  }
  return array;
}

if ("UPDATE_EXPECTED" in process.env) {
  var expectedRows = [];
  for (var i = 0; i < 1000; ++i) {
    var buffer = bufferAlloc(1);
    buffer[0] = i;

    console.log(checksum(buffer));

    expectedRows.push(bufferToArray(checksum(buffer)));
  }

  fs.writeFileSync(
    join(__dirname, "checksum.expected"),
    JSON.stringify(expectedRows)
  );
}

var expectedRows = JSON.parse(
  fs.readFileSync(join(__dirname, "checksum.expected"))
);

test("Checksum", function (t) {
  expectedRows.forEach(function (expected, index) {
    var buffer = bufferAlloc(1);
    buffer[0] = index;
    var actual = bufferToArray(checksum(buffer));
    t.deepEqual(actual, expected, 'Buffer created from ' + index);
  });
  t.end();
});
