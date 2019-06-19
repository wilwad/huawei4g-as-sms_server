/*
 * Huawei 4G Router E5186s-22a Reverse-Engineering
 * Unit test: api/sms/sms-list
 * William Sengdara ~ June 2019
 */
let port     	= 8075
var request  	= require('request')
var XML      	= require('./xml')
var h4g      	= require('./huawei4G')
var xml      	= new XML()
var huawei4G 	= new h4g()

let url 	 	= 'http://192.168.8.1' // default 4G router IP
var cookie_  	= ''
var csrf_tokens = []

var headers_ = {}
var options = {
    url: url + huawei4G.routes.init,
	headers: headers_,
    method: 'GET',
    qs: { }
}

var contacts = {
					'131':'MTC Balance'
				}

/* entry point: get sessionid for all future comms */
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
							get_sms_list( token, ( obj )=>{	console.log('Raw message list'); console.log( obj )	}, ()=>{})
						}, 
                      function( err){
						console.log(err)
					  })
    }
})

// login to the router
function login( token, cbSuccess, cbFail ){
		if (! cookie_.trim().length) {
			cbFail(`Cookie required. Does anyone know you're here?`)
			return
		}

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

			if (! loginOK){
				cbFail('__requestverificationtokenone not in response.headers')
				return
			}

			if ( type == 'error' && obj !== undefined ){
				cbFail(huawei4G.errors[ obj.code ] || 'Error not defined in huawei4G.js' )
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
			cookie_     = cookie
			csrf_tokens = []
			csrf_tokens.push( token1, token2)
			console.log('New csrf_tokens', csrf_tokens.join(','))
			cbSuccess()
		});
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
    	                ReadCount: 20, // how many messages to return
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

			console.log(type, 'Messages Count:',obj.Count)

			// push new verification header
			if ( response.headers['__requestverificationtoken'] !== undefined){
				let newtoken = response.headers['__requestverificationtoken'];
				console.log(`Got new csrf_token: '${newtoken}'`)
				csrf_tokens.push( newtoken )
			}

			if ( type == 'error' && obj !== undefined ){
				cbFail( huawei4G.errors[ obj.code ] || 'Error not defined in huawei4G.js' )
				return
            }

			var messages = raw.split(`"utf-8"?>`)[1]
							.replace(/<response>/g,"").replace(/<\/response>/g,"")
							.split("</Count>")[1] 
							.replace("<Messages>","").replace(/<\/Messages>/g,"")
							.split(/\<\/\Message>/gm).filter(el=>el.substr(0, '<Message>'.length)=='<Message>' )

			var msgs = [];

			messages.forEach((el,idx)=>{
				var n    = el.replace("<Message>","")
				var temp = n.split(/\<\/\w+>/gm).filter(el=>el.trim().length>0)
				var obj  = {}

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

			for(var idx = 0; idx < msgs.length; idx++){
				let idy = idx+1
				let msg = msgs[idx]
				let contact = contacts[ msg.Phone ] || msg.Phone
				let read = msg.Smstat == 0 ? 'unread' : 'read'
				let message = msg.Content.length > 80 ? msg.Content.substr(0,80) + '...' : msg.Content
				console.log(`${idy} ${msg.Index} ${read} ${msg.Date} -- ${contact} -- ${message}`)
			}

			cbSuccess( msgs )
		});
}
