let port = 8075
var request = require('request')
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

request(options, (error, response, data)=> {
    if (!error && response.statusCode == 200) {
		//console.log(response.headers)
		cookie_ = response.headers['set-cookie'][0].split(';')[0]

		if (! cookie_.trim().length) {
			console.log('* Failed to get sessionid from server. Bye')
			process.exit(1)
		}

		console.log('Got cookie OK\n', cookie_);
		csrf_tokens = xml.csrfTokensFromHTML( data )

		if (! csrf_tokens.length){
			console.log('Failed to parse csrf_tokens after getting sessionid!')
			process.exit(1)
		}

		console.log('****** tokens available *******')
		console.log(csrf_tokens)

		var token = csrf_tokens[0]
		csrf_tokens.splice(0,1)
		console.log('Using token', token)
		login( token, function(){
						console.log('Login successful')
						}, 
                      function( err){
						console.log(err)
					  })
    }
})

function login( token, cbSuccess, cbFail ){
		if (! cookie_.trim().length) {
			cbFail('We need a cookie')
			return
		}

		console.log('using cookie:', cookie_)

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

function logout( token, cbSuccess, cbFail ){
		if (! cookie_.trim().length) {
			cbFail('We need a cookie')
			return
		}

		console.log('using cookie:', cookie_)

		var obj = { 
					Logout : 1 
				   };

		let route = huawei4G.routes.user_logout

		let xmlStr = `<?xml version="1.0" encoding="UTF-8"?>` +
						'<request>' + xml.objectToXML( obj ) + '</request>'

		//console.log( xml.objectToXML( obj ) )

		request({
			url: `${url}/${route}`,
			method: 'POST',
			body: xmlStr,
			headers:{
				'Cookie' : cookie_ ,
				'__RequestVerificationToken': token
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
