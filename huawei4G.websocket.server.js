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
var csrf_tokens = []

var headers_ = {}
var options = {
    url: url + huawei4G.routes.init,
	headers: headers_,
    method: 'GET',
    qs: { }
}

request(options, function (error, response, data) {
    if (!error && response.statusCode == 200) {
		console.log(response.headers)
		cookie_ = response.headers['set-cookie'][0].split(';')[0]

		if (! cookie_.trim().length) {
			console.log('* Failed to get sessionid from server. Bye')
			process.exit(1)
		}

		csrf_tokens = xml.csrfTokensFromHTML( data )

		console.log('cookie:', cookie_);
		console.log('csrf_tokens:', csrf_tokens.join(','))
		start_server()
    }
})


function login( token, cbSuccess, cbFail ){
		if (! cookie_.trim().length) {
			cbFail('We need a cookie')
			return
		}

		console.log('using cookie:', cookie_)
		console.log('using token:', token)

		var obj = {
			password_type: huawei4G.login.password_type,
			Username: huawei4G.login.user,
			Password: huawei4G.login.password_type === '4' ? 
					  huawei4G.base64encodePasswordType4( huawei4G.login.user, huawei4G.login.password, token ) :
					  huawei4G.base64encode( huawei4G.login.password )
		};

		// baseEncoded password length must be 88
		//console.log(obj.Password, obj.Password.length)
		let route = huawei4G.routes.user_login

		let xmlStr = `<?xml version="1.0" encoding="UTF-8"?>` +
						'<request>' + xml.objectToXML( obj ) + '</request>'

		//console.log( xml.objectToXML( obj ) )

		request({
			url: `${url}/${route}`,
			method: 'POST',
			body: xmlStr,
			headers:{
				'Cookie' : cookie_ ,
				'__RequestVerificationToken': token,
				'Content-Length': Buffer.byteLength(xmlStr),
				'Content-Type': 'application/xml'/*,
				'Access-Control-Allow-Headers': 'Content-Type, Access-Control-Allow-Origin'*/
			}
		}, (error, response, body)=>{
			let raw  = body.replace(/(\n\r|\n|\r|\t)/gm,"")
			let type = xml.getType(raw)
			let obj  = xml.objectFromXML(raw) 
			let loginOK = response.headers['__requestverificationtokenone'] !== undefined

			//console.log(type, obj, loginOK )

			if ( type == 'error' && obj !== undefined ){
				cbFail('Huawei4G error:', huawei4G.errors[ obj.code ] || 'Error not defined in huawei4G.js' )
				return
            }

			console.log(response.headers)//statusCode);

			if (! loginOK){
				cbFail('__requestverificationtokenone not in response.headers')
				return
			}

			/* We receive
			 *
			 * __requestverificationtokenone:
			 * __requestverificationtokentwo:
			 * __requestverificationtoken:
			 * set-cookie
			 */
			let token1 = huawei4G.getHeaderValue(response.headers, '__requestverificationtokenone');
			let token2 = huawei4G.getHeaderValue(response.headers, '__requestverificationtokentwo');
			let token  = huawei4G.getHeaderValue(response.headers, '__requestverificationtoken');
			let cookie = huawei4G.getHeaderValue(response.headers, 'set-cookie');

			// replace current cookie_
			cookie_ = cookie

			console.log('token1:', token1)
			console.log('token2:', token2)
			console.log('token:', token)
			console.log('new cookie:', cookie)

			csrf_tokens = []
			csrf_tokens.push( token1, token2)

			cbSuccess()
			// try to get sms list using the newly acquired sessionid and token!
		});
}

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
		options.method = 'GET'
		options.qs = {}
		options.headers[ 'Content-Type' ] = 'text/html';

		//console.log(options.url)
		switch (route){
			case 'api/user/login':
				let token = csrf_tokens[0]
				csrf_tokens.splice(0,1)

				login( token, 
						()=>{
							console.log('login success')
							ret = { response: 'Login success'}
							socket.send( JSON.stringify(ret) )
						}, 
						(err)=>{
							console.log('Login fail')
							console.log(err)
						}
					)
				break;

			case 'api/sms/sms-list':
			case 'api/sms/set-read':
			case 'api/dhcp/settings':
				let error = {error: 'Not implemented. Requires login'}
				socket.send( JSON.stringify(error)) 
				return
				break;
		}

		request(options, function (error, response, data) {
			console.log('Error', response.statusCode, response.headers)

			if (!error && response.statusCode == 200) {
				console.log('!errors', response.headers)

				if (error) {
					socket.send( JSON.stringify(error) )
				} else {
					let ret = xml.objectFromXML(data)

					if (xml.getType(data) == 'error'){

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
/*
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

											console.log(`Got the new cookie: ${cookie_}`);

											if (requests.length){
												temp = requests.shift()
												console.log('Processing', temp.route)
												//process_request(temp.route, temp.socket)
												return
											}
										}
									})
									return
*/
									break

							 case "ERROR_WRONG_SESSION_TOKEN":
									console.log("ERROR_WRONG_SESSION_TOKEN")
									break
						}

						ret = { error: huawei4G.errors[ ret.code ] }
						socket.send( JSON.stringify( ret ) )

					} else {
						if (requests.length) {
							requests = []
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
