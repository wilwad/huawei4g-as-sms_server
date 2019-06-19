/*
 * Huawei 4G Router E5186s-22a Reverse-Engineering
 * Unit test: api/sms/sms-count
 * William Sengdara ~ June 2019
 */

// Set SMS read flag: api/sms/set-read
// You can specify multiple message indices:
// node this-script.js 1234 5678 91234
if (process.argv.length < 3){
	console.log('Error: Arguments required -- msgIndex')
	process.exit(1)
}

let arrIdx = []

for (let idx = 2; idx < process.argv.length; idx++ ){
	let msgIndex = parseInt( process.argv[ idx ].trim() );
	if ( msgIndex && arrIdx.indexOf( msgIndex) == -1) {
		arrIdx.push( msgIndex )
	} else {
		console.log(`Ignoring ${msgIndex}. Already specified.`)
	}
}

if (! arrIdx.length){
	console.log("No indices specified to process.")
	process.exit(1)
}

let port 	 = 8075
var request  = require('request')
var XML 	 = require('./xml')
var h4g 	 = require('./huawei4G')
var xml 	 = new XML()
var huawei4G = new h4g()

let url 	 = 'http://192.168.8.1' // default 4G router IP

var cookie_  = ''
var csrf_tokens = []
var headers_ = {}

var options = {
    url: url + huawei4G.routes.init,
	headers: headers_,
    method: 'GET',
    qs: { }
}

/* entrypoint */
request(options, (error, response, data)=> {
    if (!error && response.statusCode == 200) {
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
		console.log(csrf_tokens.join(','))

		var token = csrf_tokens[0]
		csrf_tokens.splice(0,1) // remove used token

		login( token, function(){
						console.log('Login successful')

							let token = csrf_tokens[ 0 ]
							csrf_tokens.splice(0,1) // remove used token
							sms_set_read( token, arrIdx, 
										 (obj)=>{ console.log(`Set to read:`, obj )	}, 
                                         (err)=>{})
						}, 
                      function( err){
						console.log(err)
					  })
    }
})

// login to router
function login( token, cbSuccess, cbFail ){
		if (! cookie_.trim().length) {
			cbFail('We need a cookie')
			return
		}

		console.log('*********** login ***********')
		console.log('using cookie:', cookie_)

		var obj = {
			password_type: huawei4G.login.password_type,
			Username: huawei4G.login.user,
			Password: huawei4G.login.password_type === '4' ? 
						huawei4G.base64encodePasswordType4( huawei4G.login.user, huawei4G.login.password, token ) :
						huawei4G.base64encode( huawei4G.login.password )
		};

		let route = huawei4G.routes.user_login
		let xmlStr = `<?xml version="1.0" encoding="UTF-8"?>` +
						'<request>' + xml.objectToXML( obj ) + '</request>'
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

			console.log(type, obj, loginOK )

			if ( type == 'error' && obj !== undefined ){
				cbFail('Huawei4G error:', huawei4G.errors[ obj.code ] || 'Error not defined in huawei4G.js' )
				return
            }

			if (! loginOK){
				cbFail('__requestverificationtokenone not in response.headers')
				return
			}

			/* After successful login, we receive
			 *
			 * __requestverificationtokenone:
			 * __requestverificationtokentwo:
			 * __requestverificationtoken:
			 * set-cookie
			 *
			 */
			let token1 = huawei4G.getHeaderValue(response.headers, '__requestverificationtokenone');
			let token2 = huawei4G.getHeaderValue(response.headers, '__requestverificationtokentwo');
			let token  = huawei4G.getHeaderValue(response.headers, '__requestverificationtoken');
			let cookie = huawei4G.getHeaderValue(response.headers, 'set-cookie');

			// replace current cookie_
			console.log('New SessionID', cookie)
			cookie_ = cookie

			//console.log('token1:', token1)
			//console.log('token2:', token2)
			//console.log('token:', token)
			//console.log('new cookie:', cookie)

			csrf_tokens = []
			csrf_tokens.push( token1, token2)
			console.log('New csrf_tokens', csrf_tokens.join(','))
			cbSuccess()
		});
}

// set sms read
function sms_set_read( csrftoken, arrIndex, cbSuccess, cbFail ) {
		if (! cookie_.trim().length) {
			cbFail('Cookie is required')
			return
		}

		console.log('******* set_sms_read ********')
		console.log('using cookie:', cookie_)
		console.log('using csrf_token:', csrftoken)

		let route = huawei4G.routes.sms_read
		var indices = arrIndex.map(el=> `<Index>${el}</Index>`).join("")
		let xmlStr = `<?xml version="1.0" encoding="UTF-8"?><request>${indices}</request>`

		console.log( `${url}/${route}` , xmlStr)

		request({
			url: `${url}/${route}`,
			method: 'POST',
			body: xmlStr,
			headers:{
						'Cookie' : cookie_ ,
						'__RequestVerificationToken': csrftoken
					}
		}, (error, response, body)=>{
			let raw  = body.replace(/(\n\r|\n|\r|\t)/gm,"")
			let type = xml.getType(raw)
			let obj  = xml.objectFromXML(raw) 

			console.log(type, obj)
			console.log(response.headers)
			console.log('Response.body:',raw);
			
			// push new verification header
			if ( response.headers['__requestverificationtoken'] !== undefined){
				let newtoken = response.headers['__requestverificationtoken'];
				console.log(`Got new csrf_token: '${newtoken}'`)
				csrf_tokens.push( newtoken )
				console.log(csrf_tokens.join(','))
			}

			if ( type == 'error' && obj !== undefined ){
				cbFail(huawei4G.errors[ obj.code ] || 'Error not defined in huawei4G.js' )
				return
            }

			cbSuccess( raw.indexOf('OK') > -1 )
		});
}
