/*
 * Huawei 4G Router E5186s-22a Reverse-Engineering
 * Unit test: api/sms/sms-count
 * William Sengdara ~ June 2019
 */

let port = 8075;
var WebSocket = require('ws');
var ws = new WebSocket(`ws://localhost:${port}`);
var h4g = require('./huawei4G')
var huawei4G = new h4g()
let route = huawei4G.routes.sms_count; // get SMS unread count

/* Response from api/sms/sms-count
{ LocalUnread: '0',
  LocalInbox: '36',
  LocalOutbox: '31',
  LocalDraft: '0',
  LocalDeleted: '0',
  SimUnread: '0',
  SimInbox: '4',
  SimOutbox: '6',
  SimDraft: '0',
  LocalMax: '500',
  SimMax: '30',
  SimUsed: '10',
  NewMsg: '0' }
*/
const { spawn } = require('child_process');
const sound = '/usr/share/sounds/ubuntu/notifications/Amsterdam.ogg'
const POLL_INTERVAL = 1000*59 // 20 seconds

var contacts = {
					'131':'MTC Balance'
				}


ws.on('message', function(message) {
  try {
	 let d = JSON.parse(message)

 	 if (d.LocalUnread){
		 // normal response for api/sms/sms-count
		 console.log(new Date().toLocaleString(), `Unread: ${d.LocalUnread}, Received: ${d.LocalInbox}, Sent: ${d.LocalOutbox}`)

		 if (d.LocalUnread > 0) {
			// we have unread messages, play a sound
			spawn('paplay', [ sound ]);
			ws.send( 'api/sms/sms-list' )
		 }
	 } else {
			// server processed the messages from xml to Object
			let msgs = d.Messages;

			console.log('\nMessages received:')

			for(var idx = 0; idx < msgs.length; idx++){
				let idy = idx+1
				let msg = msgs[idx]
				let contact = contacts[ msg.Phone ] || msg.Phone
				let read = msg.Smstat == 0 ? 'unread' : 'read'
				console.log(`${idy} ${msg.Index} ${read} ${msg.Date} -- ${contact} -- ${msg.Content}`)
			}

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
	ws.send( route );
}

console.log(`Huawei4G NodeJ Websocket Client Interval listening on port: ${port}`)
