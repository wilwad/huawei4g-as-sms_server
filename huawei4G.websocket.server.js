let port = 8075
var request = require('request')
var WebSocket = require('ws')
var WebSocketServer = WebSocket.Server
var server = new WebSocketServer({port:port})
var XML = require('./xml')
var h4g = require('./huawei4G')
var xml = new XML()
var huawei4G = new h4g()

let url = 'http://192.168.8.1' // default 4G router IP

var requests = []
var cookie_  = ''

var headers_ = {}
var options = {
    url: url + huawei4G.routes.init,
	headers: headers_,
    method: 'GET',
    qs: { }
}

request(options, function (error, response, data) {
    if (!error && response.statusCode == 200) {
		//console.log(response.headers)
		cookie_ = response.headers['set-cookie'][0].split(';')[0]

		if (! cookie_.trim().length) {
			console.log('* Failed to get sessionid from server. Bye')
			process.exit(1)
		}

		console.log(cookie_);
		start_server()
    }
})

function process_request(route, socket){
		if (! cookie_.trim().length) {
			console.log('* Cookie monster need his cookie. Bye')
			process.exit(1)
			return
		}

		let temp = {}
		temp['route'] = route
        temp['socket'] = socket

		requests.push(temp)

		options.url = `${url}/${route}`
		options.headers['Cookie'] = cookie_
		//console.log(options.url)

		request(options, function (error, response, data) {
			if (!error && response.statusCode == 200) {
				if (error) {
					socket.send( JSON.stringify(error) )
				} else {
					let ret = xml.getObjectFromXML(data)

					if (xml.getXMLtype(data) == 'error'){

						switch (huawei4G.errors[ ret.code ]){
							 case "ERROR_SYSTEM_NO_SUPPORT":
							 case "ERROR_SYSTEM_NO_RIGHTS":
							 case "ERROR_SYSTEM_BUSY":
							 case "ERROR_LOGIN_USERNAME_WRONG":
							 case "ERROR_LOGIN_PASSWORD_WRONG":
							 case "ERROR_LOGIN_ALREADY_LOGIN":
							 case "ERROR_LOGIN_USERNAME_PWD_WRONG":
							 case "ERROR_LOGIN_USERNAME_PWD_ORERRUN":
							 case "ERROR_LOGIN_USERNAME_PWD_TWO":
							 case "ERROR_VOICE_BUSY" :
							 case "ERROR_WRONG_TOKEN":
									break;

							 case "ERROR_WRONG_SESSION":
									console.log('Session expired. Fetching another...');

									headers_ = {}
									options = {
										url: url + huawei4G.routes.init,
										headers: headers_,
										method: 'GET',
										qs: { }
									}

									request(options, function (error, response, data) {
										if (!error && response.statusCode == 200) {
											cookie_ = ""

											// get the cookie
											cookie_ = response.headers['set-cookie'][0].split(';')[0]

											if (! cookie_.trim().length) {
												console.log('* Failed to get sessionid from server')
												process.exit(1)
											}

											console.log(`Requested a new cookie: ${cookie_}`);
											if (requests.length){
												temp = requests.shift()
												process_request(temp.route, temp.socket)
												return
											}
										}
									})
									return

									break

							 case "ERROR_WRONG_SESSION_TOKEN":
									break
						}

						ret = { error: huawei4G.errors[ ret.code ] }
						socket.send( JSON.stringify( ret ) )

					} else {
						if (requests.length) {
							requests.pop()
						}

						if (ret == undefined){
							ret = { error: 'Failed to parse XML' }
						}

						console.log('respond:', ret)

						socket.send( JSON.stringify(ret) )
					} // if type == 'error'
				}
			}
		})
}

/**
 * Start accepting WebSocket traffic
 */
function start_server(){
		console.log(`Huawei4G NodeJS Websocket Server listening on ws port: ${port}`)

		server.on('connection', function(socket) {

		  socket.on('message', function(message) {
			console.log( `Received: ${message}` )
			process_request(message, socket)
		  });

		  socket.on('close', function(msg, disconnect) {
			console.log(`Client disconnected`);
		  });
		});
}
