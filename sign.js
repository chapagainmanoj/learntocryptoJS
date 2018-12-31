const sodium = require('sodium-native')

var publicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
var secretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
sodium.crypto_sign_keypair(publicKey, secretKey)

const message = Buffer.from("Hello world!")
var signature = Buffer.alloc(sodium.crypto_sign_BYTES)

sodium.crypto_sign_detached(signature, message, secretKey)

console.log('Public key:', publicKey.toString('hex'))
console.log('Message:', message.toString())
console.log('Signature:', signature.toString('hex'))
// hide it
// console.log('Private key:', secretKey.toString('hex'))
