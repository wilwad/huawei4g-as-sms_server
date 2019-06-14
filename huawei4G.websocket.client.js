/* interactive test client */
let port = 8075;
var WebSocket = require('ws');
var ws = new WebSocket(`ws://localhost:${port}`);
var h4g = require('./huawei4G')
var huawei4G = new h4g()

let hint = "\nType a route below then press Return. Type 'routes' to list available routes:"

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function(message) {
  message = message.trim();
  switch (message.toLowerCase()){
	case 'routes':
		console.log(huawei4G.routes)
		console.log('\nNow type the desired route (e.g. api/wlan/basic-settings) below then press Return:')
		break;

	default:
	  	ws.send(message, console.log.bind(null, `Sent: ${message} ${hint}`));
  }

});

ws.on('message', function(message) {
  console.log('-> Received: ' + message);
  try {
	 let d = JSON.parse(message)
	 console.log(d)
  } catch (e){
		console.log(e)
  }
  console.log(hint)
});

ws.on('close', function(code) {
  console.log('Disconnected: ' + code);
  process.exit(0)
});

ws.on('error', function(error) {
  console.log('Error: ' + error.code);
});

console.log(`Huawei4G NodeJ Websocket Client listening on port: ${port} ${hint}`)
