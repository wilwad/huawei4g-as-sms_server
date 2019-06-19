/*
 * Huawei 4G Router E5186s-22a Reverse-Engineering
 * NodeJS / WebSocket Interface
 * William Sengdara ~ June 2019
 */
let port            = 8075					// Our WebSocket port
var request         = require('request')
var WebSocket       = require('ws')
var WebSocketServer = WebSocket.Server
var server 			= new WebSocketServer({port:port})

let url 			= 'http://192.168.8.1' // default 4G router IP
let MAX_SMS_LIST 	= 20	// how many messages do you want returned by get_sms_list

/* My Huawei 4G Lib */
var XML 			= require('./xml')
var h4g 			= require('./huawei4G')
var xml 			= new XML()
var huawei4G 		= new h4g()

var cookie_     = ''
var csrf_tokens = []
var headers_    = {}

// initial options
var options = {
    url: url + huawei4G.routes.init, // root gets us the cookie
	headers: headers_,
    method: 'GET',
    qs: { }
}

/* entry point
 * gets us our first sessionid for all subsequent comms
 */
request(options, function (error, response, data) {
    if (!error && response.statusCode == 200) {
		cookie_ = response.headers['set-cookie'][0].split(';')[0]

		if (! cookie_.trim().length) {
			console.log('* Failed to get sessionid from server. Bye')
			process.exit(1)
		}

		csrf_tokens = xml.csrfTokensFromHTML( data )

		console.log('cookie:', cookie_);
		console.log('csrf_tokens:', csrf_tokens.join(','))

		let token = csrf_tokens[0]
		csrf_tokens.splice(0,1)

		// attempt to loin
		login( token, 
				()=>{
					console.log('Login success. Starting WebSocket server. Standby...')
					start_server()
				}, 
				(err)=>{
					console.log('Login failure. Check credentials inside Huawei4G.js. WebSocket Server not started.')
					console.log(err)
				}
			)
    }
})

/* login to the router */
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
		request({
			url: `${url}/${route}`,
			method: 'POST',
			body: xmlStr,
			headers:{
						'Cookie' : 					  cookie_ ,
						'__RequestVerificationToken': token,
						'Content-Length': 			  Buffer.byteLength(xmlStr)
					}
		}, (error, response, body)=>{
			let raw  = body.replace(/(\n\r|\n|\r|\t)/gm,"")
			let type = xml.getType(raw)
			let obj  = xml.objectFromXML(raw) 
			let loginOK = response.headers['__requestverificationtokenone'] !== undefined

			if ( type == 'error' && obj !== undefined ){
				cbFail('Huawei4G error:', huawei4G.errors[ obj.code ] || 'Error not defined in huawei4G.js' )
				return
            }

			if (! loginOK){
				cbFail('__requestverificationtokenone not in response.headers')
				return
			}

			let token1 = huawei4G.getHeaderValue(response.headers, '__requestverificationtokenone');
			let token2 = huawei4G.getHeaderValue(response.headers, '__requestverificationtokentwo');
			let token  = huawei4G.getHeaderValue(response.headers, '__requestverificationtoken');
			let cookie = huawei4G.getHeaderValue(response.headers, 'set-cookie');

			// replace current cookie_
			cookie_ = cookie

			console.log('token1:', token1)
			console.log('token2:', token2)
			console.log('new cookie:', cookie)

			csrf_tokens = []
			csrf_tokens.push( token1, token2)

			cbSuccess()
		});
}

/**
 * Start accepting WebSocket traffic
 */
function start_server(){
		console.log(`Huawei4G NodeJS Websocket Server Started OK. Listening on ws port: ${port}`)

		server.on('connection', function(socket) {

					  socket.on('message', function(message) {
						console.log( `Received from client: ${message}` )
						process_request(message, socket)
					  });

					  socket.on('close', function(msg, disconnect) {
						console.log(`A client disconnected.`);
					  });

		});
}

/**
 * Handle incoming requests
 */
function process_request(route, socket){
		if (! cookie_.trim().length) {
			console.log('Cookie required.')
			return
		}

		switch (route){
			case 'api/sms/sms-list':
				let token = csrf_tokens[0]
				csrf_tokens.splice(0,1)
				get_sms_list(token, 
							 (msgs)=>{
								    var ret = {Messages:msgs}; 
									socket.send( JSON.stringify(ret) )
								}, 
							 (err)=>{ 
										var ret = {error: err}; 
										socket.send( JSON.stringify(ret) ) 
									} 
							)
				return
				break;
		}

		options.url               = `${url}/${route}`
		options.headers['Cookie'] = cookie_
		options.method            = 'GET'
		options.qs                = {}
		options.headers[ 'Content-Type' ] = 'text/html';

		//console.log(options.url)
		request(options, function (error, response, data) {
			//console.log('Error', response.statusCode, response.headers)

			if (!error && response.statusCode == 200) {
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
									break;

							 case "ERROR_WRONG_TOKEN":
									console.log("ERROR_WRONG_TOKEN");
									break;

							 case "ERROR_WRONG_SESSION":
									console.log('ERROR_WRONG_SESSION');
									break

							 case "ERROR_WRONG_SESSION_TOKEN":
									console.log("ERROR_WRONG_SESSION_TOKEN");
									break
						}

						ret = { error: huawei4G.errors[ ret.code ] }
						socket.send( JSON.stringify( ret ) )

					} else {

						if (ret == undefined){
							ret = { error: 'Failed to parse XML' }
						}

						//console.log(data)
						//console.log('respond:', ret)

						socket.send( JSON.stringify(ret) )
					} // if type == 'error'
				}
			}
		})
}

/*
 * Ask the 4G router to give you SMS messages in: 1 Inbox, 2 Sent, 3 Drafts
*/
function get_sms_list( csrftoken, cbSuccess, cbFail ){
		if (! cookie_.trim().length) {
			cbFail('Cookie is required')
			return
		}

		let route = huawei4G.routes.sms_list

		let filter = { 
						Ascending: 0,
						BoxType: huawei4G.sms_box.inbox,
						PageIndex: 1,
    	                ReadCount: MAX_SMS_LIST, /* how many messages do you want returned */
						SortType: 0,
    	                UnreadPreferred: 0
					}

		let xmlStr = `<?xml version="1.0" encoding="UTF-8"?>
					 <request>
						<PageIndex>${filter.PageIndex}</PageIndex>
						<ReadCount>${filter.ReadCount}</ReadCount>
						<BoxType>${filter.BoxType}</BoxType>
						<SortType>${filter.SortType}</SortType>
						<Ascending>${filter.Ascending}</Ascending>
						<UnreadPreferred>${filter.UnreadPreferred}</UnreadPreferred>
					</request>`

		request({
			url: `${url}/${route}`,
			method: 'POST',
			body: xmlStr.replace(/(\r\n|\n|\r|\t)/gm,""),
			headers:{
						'Cookie' : cookie_ ,
						'__RequestVerificationToken': csrftoken
					}
		}, (error, response, body)=>{
			let raw  = body.replace(/(\n\r|\n|\r|\t)/gm,"")
			let type = xml.getType(raw)
			let obj  = xml.objectFromXML(raw) 

			console.log(type, 'Count:',obj.Count)

			// push new verification header
			if ( response.headers['__requestverificationtoken'] !== undefined){
				let newtoken = response.headers['__requestverificationtoken'];
				console.log(`Got new csrf_token: '${newtoken}'`)
				csrf_tokens.push( newtoken )
				console.log(csrf_tokens.join(','))
			}

			if ( type == 'error' && obj !== undefined ){
				cbFail( huawei4G.errors[ obj.code ] || 'Error not defined in huawei4G.js' )
				return
            }

			var messages = raw.split(`"utf-8"?>`)[1] // <?xml
							.replace(/<response>/g,"").replace(/<\/response>/g,"") // <response>
							.split("</Count>")[1] // <Count>total_messages</Count>
							.replace("<Messages>","").replace(/<\/Messages>/g,"") // <Messages></Messages>
							.split(/\<\/\Message>/gm).filter(el=>el.substr(0, '<Message>'.length)=='<Message>' )

			var msgs = [];

			/**
			 * <Message> 
				<Smstat>1</Smstat>
				<Index>40026</Index>
				<Phone></Phone>
				<Content></Content>
				<Date></Date>
				<Sca></Sca>
				<SaveType></SaveType>
				<Priority></Priority>
				<SmsType></SmsType>
               </Message>
			 */
			messages.forEach((el,idx)=>{
				var n = el.replace("<Message>","")
				var temp = n.split(/\<\/\w+>/gm).filter(el=>el.trim().length>0)
				var obj = {}
				temp.forEach(el=>{
					var t    =  el.split('>')
					var key  = t[0].replace('<','')
					var data = t[1]
								.replace(/&apos;/gm,"'")
								.replace(/&#x2F;/gm,":")
								.replace(/&#41;/gm,")")

					obj[ key ] = data
				})
				msgs.push(obj)
			})

			cbSuccess( msgs )
		});
}
