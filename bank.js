const jsonStream = require("duplex-json-stream");
const net = require('net');
const fs = require('fs');
const sodium = require('sodium-native');

const FILE = './transaction-log.json';

const initLog = [
  {cmd: 'genesis', hash: Buffer.alloc(sodium.crypto_generichash_BYTES).toString('base64')},
];

var log = []

var state = { balance: 0 }

// var log = require(FILE)

try {
  log = require(FILE);
  console.info('Transaction read from file.');
  state.balance = getBalanceFromLog(log)
} catch (e) {
  if(e.code === 'MODULE_NOT_FOUND') {
    var content = JSON.stringify (initLog, null, 4);
    fs.writeFile(FILE, content, 'utf8', function (err) {
      if (err) console.log(err);
      console.log("Transaction file initiated");
      log = initLog;
    });
  }
  else {
    console.log(e);
  }
}

function checkIntegrity(txnLog) {
  var is_healty = true
  for (i = 1; i < txnLog.length; i++) {
    if (hashchain(txnLog[i-1].hash, txnLog[i].value) !== txnLog[i].hash) { is_healty = false; break;};
  }
  return is_healty;
}

console.log("Integrity", checkIntegrity(log));

function getBalanceFromLog(txnLog) {
  return txnLog.reduce(function(a, c){
    if (c.value && c.value.cmd === 'deposit')  return a + c.value.amount;
    else if (c.value && c.value.cmd == 'withdraw') return a - c.value.amount;
    else return a;
  }, 0)
}

console.log("Starting balance in log:", state.balance);

const server = net.createServer(function(socket) {
  socket = jsonStream(socket)

  socket.on('data', function(msg) {
    console.log("Action received:", msg);
    ondata(socket, msg)
  })
});

function ondata(socket, msg) {
  var amount = msg.amount || 0

  switch (msg.cmd) {
    case 'balance':
      socket.write({status: "success", msg: 'Balance: ' + state.balance})
      break;

    case 'deposit':
      var entry = {
        value: msg,
        hash: hashchain(log[log.length-1].hash, msg) // hashing the action
      }
      state.balance += amount;

      log.push(entry);

      content = JSON.stringify(log, null, 4)
      fs.writeFile(FILE, content, 'utf8')
      socket.write({status: "success", msg: 'Balance: ' + state.balance})
      break;

    case 'withdraw':
      if (amount > state.balance) {
        socket.write({status: "error", msg: 'Unsufficient balance'})
        break;
      } else {
        state.balance -= amount;

        var entry = {
          value: msg,
          hash: hashchain(log[log.length-1].hash, msg) // hashing the action
        }

        log.push(entry)
        content = JSON.stringify(log, null, 4)
        fs.writeFile(FILE, content, 'utf8')
        socket.write({status: "success", msg: 'Balance: ' + state.balance})
        break;
      }

    default:
      socket.write({status: 'error', msg: 'Unknown command'})
  }
}

// function getBankLogEntry(msg, log) {
//   if (log.constructor === Array && log.length) {
//     return {
//       value: msg,
//       hash: hashchain(log[log.length-1].hash, msg) // hashing the action
//     }
//   }
//   return;
// }

function hashchain(prevHash, curValue) {
  var inputBuf = Buffer.from(prevHash + JSON.stringify(curValue))
  var hashBuf = Buffer.alloc(sodium.crypto_generichash_BYTES)

  sodium.crypto_generichash(hashBuf, inputBuf)

  return hashBuf.toString('base64')
}

server.listen(3876)
