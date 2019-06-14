let port = 8075;
var WebSocket = require('ws');
var ws = new WebSocket(`ws://localhost:${port}`);
var h4g = require('./huawei4G')
var huawei4G = new h4g()
let route = 'api/monitoring/check-notifications'; // route to get SMS unread count
const { spawn } = require('child_process');
const sound = '/usr/share/sounds/ubuntu/notifications/Amsterdam.ogg'
const POLL_INTERVAL = 1000*59 // 20 seconds

ws.on('message', function(message) {
  try {
	 let d = JSON.parse(message)
	 console.log(new Date().toLocaleString(), `Inbox unread: ${d.UnreadMessage}`)

	 if (d.UnreadMessage > 0) {
		// we have unread messages, play a sound
		spawn('paplay', [ sound ]);
	 }
  } catch (e){
		console.log(e)
  }
});

ws.on('open', function(){
	request_sms_count() // first query
	setInterval(request_sms_count, POLL_INTERVAL) // schedule
});

ws.on('close', function(code) {
	  console.log('Disconnected. Bye');
	  process.exit( 0 )
});

ws.on('error', function(error) {
  console.log('Error: ' + error.code);
});

var request_sms_count = function(){
	ws.send(route);
}

console.log(`Huawei4G NodeJ Websocket Client Interval listening on port: ${port}`)
