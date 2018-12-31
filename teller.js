const jsonStream = require('duplex-json-stream');
const net = require('net');

const client = jsonStream(net.connect(3876))

var command = process.argv[2]
var amount = parseInt(process.argv[3]) || 0

client.on('data', function(msg) {
  console.log('Teller received', msg);
})

switch (command) {
  case 'balance':
    client.end({cmd: command})
    break

  case 'deposit':
    client.end({cmd: command, amount: amount})
    break
  case 'withdraw':
    client.end({cmd: command, amount: amount})
    break

  default:
    console.log("Unknown command");
    break
}
