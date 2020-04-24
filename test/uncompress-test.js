var spawn = require('child_process').spawn

  , createUncompressStream = require('../').createUncompressStream
  , test = require('tap').test
  , largerInput = require('fs').readFileSync(__filename)
  , largerInputString = largerInput.toString()

test('uncompress small string', function (t) {
  var child = spawn('python', [ '-m', 'snappy', '-c' ])
    , uncompressStream = createUncompressStream({ asBuffer: false })
    , data = ''

  uncompressStream.on('data', function (chunk) {
    data = data + chunk
    t.equal(typeof(chunk), 'string')
  })

  uncompressStream.on('end', function () {
    t.equal(data, 'beep boop')
    t.end()
  })

  child.stdout.pipe(uncompressStream)

  child.stdin.write('beep boop')
  child.stdin.end()
})

test('uncompress small Buffer', function (t) {
  var child = spawn('python', [ '-m', 'snappy', '-c' ])
    , uncompressStream = createUncompressStream()
    , data = []

  uncompressStream.on('data', function (chunk) {
    data.push(chunk)
    t.ok(Buffer.isBuffer(chunk))
  })

  uncompressStream.on('end', function () {
    t.deepEqual(Buffer.concat(data), new Buffer('beep boop'))
    t.end()
  })

  child.stdout.pipe(uncompressStream)

  child.stdin.write(new Buffer('beep boop'))
  child.stdin.end()
})

test('uncompress large string', function (t) {
  var child = spawn('python', [ '-m', 'snappy', '-c' ])
    , uncompressStream = createUncompressStream({ asBuffer: false })
    , data = ''

  uncompressStream.on('data', function (chunk) {
    data = data + chunk
    t.equal(typeof(chunk), 'string')
  })

  uncompressStream.on('end', function () {
    t.equal(data, largerInputString)
    t.end()
  })

  child.stdout.pipe(uncompressStream)

  child.stdin.write(largerInput)
  child.stdin.end()
})

test('uncompress large string', function (t) {
  var child = spawn('python', [ '-m', 'snappy', '-c' ])
    , uncompressStream = createUncompressStream()
    , data = []

    uncompressStream.on('data', function (chunk) {
      data.push(chunk)
      t.ok(Buffer.isBuffer(chunk))
    })

    uncompressStream.on('end', function () {
      t.deepEqual(Buffer.concat(data), largerInput)
      t.end()
    })


  child.stdout.pipe(uncompressStream)

  child.stdin.write(largerInput)
  child.stdin.end()
})

test('uncompress with bad identifier', function (t) {
  var uncompressStream = createUncompressStream()

  uncompressStream.on('error', function (err) {
    t.equal(err.message, 'malformed input: bad identifier')
    t.end()
  })

  uncompressStream.write(
    new Buffer([ 0xff, 0x06, 0x00, 0x00, 0x73, 0x4e, 0x61, 0x50, 0x70, 0x60 ])
  )
  uncompressStream.end()
})

test('uncompress with bad first frame', function (t) {
  var uncompressStream = createUncompressStream()

  uncompressStream.on('error', function (err) {
    t.equal(err.message, 'malformed input: must begin with an identifier')
    t.end()
  })

  uncompressStream.write(
    new Buffer([ 0x0, 0x06, 0x00, 0x00, 0x73, 0x4e, 0x61, 0x50, 0x70, 0x60 ])
  )
  uncompressStream.end()
})

test('uncompress large String in small pieces', function (t) {
  var child = spawn('python', [ '-m', 'snappy', '-c' ])
    , uncompressStream = createUncompressStream()
    , data = []

    uncompressStream.on('data', function (chunk) {
      data.push(chunk)
      t.ok(Buffer.isBuffer(chunk))
    })

    uncompressStream.on('end', function () {
      t.deepEqual(Buffer.concat(data), largerInput)
      t.end()
    })

  child.stdout.on('data', function (chunk) {
    var i = 0;

    while (i < chunk.length) {
      uncompressStream.write(new Buffer([ chunk[i] ]))
      i++
    }
  })

  child.stdout.once('end', function () {
    uncompressStream.end()
  })

  child.stdin.write(largerInput)
  child.stdin.end()
})

test('uncompress small Buffer across multiple chunks', function (t) {
  var uncompressStream = createUncompressStream()
    , data = []
    , IDENTIFIER = new Buffer([
      0xff, 0x06, 0x00, 0x00, 0x73, 0x4e, 0x61, 0x50, 0x70, 0x59
    ])

  uncompressStream.on('data', function (chunk) {
    data.push(chunk)
    t.ok(Buffer.isBuffer(chunk))
  })

  uncompressStream.on('end', function () {
    t.deepEqual(Buffer.concat(data), new Buffer('beep boop'))
    t.end()
  })

  // identifier
  uncompressStream.write(IDENTIFIER)
  // "beep"
  uncompressStream.write(new Buffer([0x01, 0x08, 0x00, 0x00, 0xfb, 0x5e, 0xc9, 0x6e, 0x62, 0x65, 0x65, 0x70]))
  // " boop"
  uncompressStream.write(new Buffer([0x01, 0x09, 0x00, 0x00, 0x5f, 0xae, 0xb4, 0x84, 0x20, 0x62, 0x6f, 0x6f, 0x70]))
  uncompressStream.end()
})

test('uncompress large string across multiple chunks', function (t) {
  var child1 = spawn('python', [ '-m', 'snappy', '-c' ])
    , IDENTIFIER = new Buffer([
        0xff, 0x06, 0x00, 0x00, 0x73, 0x4e, 0x61, 0x50, 0x70, 0x59
      ])
    , uncompressStream = createUncompressStream({ asBuffer: false })
    , data = ''

  uncompressStream.on('data', function (chunk) {
    data = data + chunk
    t.equal(typeof(chunk), 'string')
  })

  uncompressStream.on('end', function () {
    t.equal(data, largerInputString + largerInputString)
    t.end()
  })

  // manually pipe processes in so we can remove identifiers
  child1.stdout.on('data', function(chunk) {
    uncompressStream.write(chunk.slice(10))
  })

  child1.once('close', function () {
    var child2 = spawn('python', [ '-m', 'snappy', '-c' ])

    child2.stdout.on('data', function(chunk) {
      uncompressStream.write(chunk.slice(10))
      uncompressStream.end()
    })  

    // trigger second write after first write
    child2.stdin.write(largerInput)
    child2.stdin.end()
  })

  // write identifier only once
  uncompressStream.write(IDENTIFIER)

  child1.stdin.write(largerInput)
  child1.stdin.end()
})

test('uncompress large string with padding chunks', function (t) {
  var child1 = spawn('python', [ '-m', 'snappy', '-c' ])
    , IDENTIFIER = new Buffer([
        0xff, 0x06, 0x00, 0x00, 0x73, 0x4e, 0x61, 0x50, 0x70, 0x59
      ])
    , uncompressStream = createUncompressStream({ asBuffer: false })
    , data = ''

  uncompressStream.on('data', function (chunk) {
    data = data + chunk
    t.equal(typeof(chunk), 'string')
  })

  uncompressStream.on('end', function () {
    t.equal(data, largerInputString + largerInputString)
    t.end()
  })

  // manually pipe processes in so we can remove identifiers
  child1.stdout.on('data', function(chunk) {
    uncompressStream.write(chunk.slice(10))
    // padding
    uncompressStream.write(Buffer.from([0xfe, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))
  })

  child1.on('close', () => {
    var child2 = spawn('python', [ '-m', 'snappy', '-c' ])

    child2.stdout.on('data', function(chunk) {
      uncompressStream.write(chunk.slice(10))
      uncompressStream.end()
    })
  
      // trigger second write after first write
      child2.stdin.write(largerInput)
      child2.stdin.end()
  })

  // write identifier only once
  uncompressStream.write(IDENTIFIER)

  child1.stdin.write(largerInput)
  child1.stdin.end()
})