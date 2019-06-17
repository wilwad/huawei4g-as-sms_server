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
		cookie_ = huawei4G.getHeaderValue( response.headers, 'set-cookie')

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
		login( token )	

		//setInterval(get_tokens, 1000 * 20)
    }
})

function get_tokens(){
		if (! cookie_.trim().length) {
			console.log('* Cookie monster needs his cookie. Bye')
			process.exit(1)
			return
		}

		console.log('using cookie:', cookie_)

		let route = huawei4G.routes.init

		if (csrf_tokens.length){
			var token = csrf_tokens[0]
			csrf_tokens.splice(0,1)
			get_sms_list( token )
		} else {
			console.log( 'tokens used up ~ fetching new' )

			request({
				url: `${url}/${route}`,
				method: 'GET',
				headers:{'Cookie' : cookie_ }
			}, (error, response, body)=>{
				let raw  = body.replace(/(\n\r|\n|\r|\t)/gm,"")
				csrf_tokens = xml.csrfTokensFromHTML( raw )

				console.log(csrf_tokens)

				var token = csrf_tokens[0]
				csrf_tokens.splice(0,1)
				get_sms_list( token )

			});

		}
}

function login( token ){
		if (! cookie_.trim().length) {
			console.log('* Cookie monster needs his cookie. Bye')
			process.exit(1)
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

		console.log(obj.Password, obj.Password.length)
		let route = huawei4G.routes.user_login

		let xmlStr = `<?xml version="1.0" encoding="UTF-8"?>` +
						'<request>' + xml.objectToXML( obj ) + '</request>'

		console.log( xml.objectToXML( obj ) )

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

			console.log(type, obj)
			//console.log(response.toJSON())
			console.log(response.headers)//statusCode);
			console.log('Response.body:',raw);

			if ( type == 'error' && obj !== undefined ){
				console.log('Huawei4G error:', huawei4G.errors[ obj.code ] || 'Error not defined in huawei4G.js' )
            }
			//console.log('error',error);
		});
}

function get_sms_list( csrftoken ){
		if (! cookie_.trim().length) {
			console.log('* Cookie monster needs his cookie. Bye')
			process.exit(1)
			return
		}

		console.log('using cookie:', cookie_)
		console.log('using csrf_token:', csrftoken)
		let route = huawei4G.routes.sms_list

		options.url = `${url}/${route}`
		options.method = 'POST'
		options.qs = {}
		options.headers[ 'Content-Type' ] = 'text/html';
		let obj = { Ascending: 0,
					BoxType: 1,
					PageIndex: 1,
                    ReadCount: 0,
					SortType: 0,
                    UnreadPreferred: 0}

		let xmlStr = `<?xml version="1.0" encoding="UTF-8"?>` +
						'<request>' + xml.objectToXML( obj ) + '</request>'

		console.log(xmlStr)
		request({
			url: `${url}/${route}`,
			method: 'GET',
			body: xmlStr,
			headers:{
				'Cookie' : cookie_ ,
				'__RequestVerificationToken': csrftoken/*,
				'Content-Length': Buffer.byteLength(xmlStr),
				'Content-Type': 'application/xml',
				'Access-Control-Allow-Headers': 'Content-Type, Access-Control-Allow-Origin'*/
			}
		}, (error, response, body)=>{
			let raw  = body.replace(/(\n\r|\n|\r|\t)/gm,"")
			let type = xml.getType(raw)
			let obj  = xml.objectFromXML(raw) 

			console.log(type, obj)

			//console.log(response.toJSON())
			console.log(response.headers)//statusCode);
			console.log('Response.body:',raw);

			if ( type == 'error' && obj !== undefined ){
				console.log('Huawei4G error:', huawei4G.errors[ obj.code ] || 'Error not defined in huawei4G.js' )
            }

			let newCookie = response.headers['set-cookie'] && response.headers['set-cookie'][0].split(';')[0] || cookie_
			if ( cookie_ == newCookie){
				console.log('***** sessionid has not changed')
			} else {
				console.log('***** sessionid was changed to', newCookie)
			}

			if (type == 'error' && response.headers['__requestverificationtoken'] !== undefined){
				console.log(csrf_tokens)
				let newtoken = response.headers['__requestverificationtoken'];
				console.log(`The csrf_token '${csrftoken}' was rejected. Got new csrf_token: '${newtoken}'`)
				csrf_tokens.push( newtoken )
				console.log(csrf_tokens)
				csrftoken = csrf_tokens[0]
				csrf_tokens.splice(0,1)
				get_sms_list( csrftoken )
				return
			}

			//console.log('error',error);
		});
}
