const sodium = require('sodium-native');

var output = Buffer.alloc(sodium.crypto_generichash_BYTES)
var input = Buffer.from("Hello, World!")

sodium.crypto_generichash(output, input)

console.log(output.toString('hex'));
