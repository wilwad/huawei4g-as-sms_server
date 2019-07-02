/*
 * Huawei 4G Router E5186s-22a Reverse-Engineering
 * Unit test: api/sms/sms-list to MySQL
 * William Sengdara ~ June 2019
 */

/*
  Database: SMS
*
* 

CREATE TABLE `inbox` (
  `id` int(3) NOT NULL AUTO_INCREMENT,
  `entrydate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `msisdn` varchar(13) NOT NULL,
  `message` longtext,
  `wasread` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=latin1;

CREATE TABLE `sent` (
  `id` int(3) NOT NULL AUTO_INCREMENT,
  `entrydate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `msisdn` varchar(13) NOT NULL,
  `message` longtext,
  `wasread` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=latin1;

*/

// if 1 param specified: boxtype (inbox, sent, drafts)
// if 2 params specified: boxtype, max_messages to retrieve

let port     	= 8075
// Ensure you have the mysql installed, if not: npm install mysql
var mysql       = require('mysql');
var request  	= require('request')
var { spawn }   = require('child_process');
var XML      	= require('./xml')
var h4g      	= require('./huawei4G')
var xml      	= new XML()
var huawei4G 	= new h4g()

let url 	 	= huawei4G.url
var cookie_  	= ''
var csrf_tokens = []

var headers_ = {}
var options = {
    url: url + huawei4G.routes.init,
	headers: headers_,
    method: 'GET',
    qs: { }
}

var globals = {}
globals.db_connected 	 = false;
globals.sound = '/usr/share/sounds/ubuntu/notifications/Slick.ogg'

var conn 		     = mysql.createConnection({
									  host    : "localhost",
									  user    : "root",
									  password: "Admin.2015!",
									  database: "SMS"
									});
// connect or fail
conn.connect(function(err) {
	if (err) throw err;    
	globals.db_connected = true;
});

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

							var boxtype = huawei4G.sms_box.inbox
							var max_messages = 20

							if (process.argv.length == 3) {
								boxtype = process.argv[2]
								boxtype = (boxtype == huawei4G.sms_box.inbox || 
								  		   boxtype == huawei4G.sms_box.sent || 
								           boxtype == huawei4G.sms_box.drafts) ? boxtype : huawei4G.sms_box.inbox

							} else if (process.argv.length == 4) {
								boxtype = process.argv[2]
								boxtype = (boxtype == huawei4G.sms_box.inbox || 
								  		   boxtype == huawei4G.sms_box.sent || 
								           boxtype == huawei4G.sms_box.drafts) ? boxtype : huawei4G.sms_box.inbox

								max_messages = process.argv[3]	
							}
							
							globals.sms_done = 0;
							globals.sms_max = 0;

							var table = boxtype == 1 ? 'inbox' : 'sent'; 

							get_sms_list( token, boxtype, max_messages, ( msgs )=>{	
								if (! msgs.length){
									conn.end()
									process.exit(0)
								}

								globals.sms_max = msgs.length;

								for(var idx = 0; idx < msgs.length; idx++){
									let idy = idx+1
									let msg = msgs[idx]
									let contact = huawei4G.contacts[ msg.Phone ] || msg.Phone
									let read = msg.Smstat == 0 ? 'unread' : 'read'
									let message = msg.Content
									msg.Date = msg.Date.replace(/-/g,"/")
									console.log(`${idy}. ${msg.Index} ${read} ${msg.Date} -- ${msg.Phone} (${contact}) -- ${message}`)

									if (boxtype == huawei4G.sms_box.inbox || boxtype == huawei4G.sms_box.sent) {

										let sql=`INSERT INTO ${table} (entrydate, msisdn, message, wasread) VALUES(?,?,?,?)`;
										console.log(sql)

										if (globals.db_connected){

											conn.query(sql, [ msg.Date, msg.Phone, msg.Content, msg.Smstat == 0 ? 0 : 1 ], (err, result)=>{
												if (err) {
													console.log('Error', err)
												} else {
													console.log('INSERT OK', msg.Phone)
													
													spawn('node', ['./unittest.request.sms_delete.js', msg.Index ]);

													globals.sms_done++

													if (globals.sms_done >= globals.sms_max){
														console.log("Completed", globals.sms_done, globals.sms_max)
														conn.end()
														process.exit(0)			
													}
												}
											})
											
										} else {
											console.log('DB not connected')
										}
									} else {
										console.log('Not a valid box', boxtype)
									}								
								}
													
							}, ()=>{})
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
function get_sms_list( csrftoken, boxtype, max_messages, cbSuccess, cbFail ){
		if (! cookie_.trim().length) {
			cbFail('Cookie is required')
			return
		}

		let route = huawei4G.routes.sms_list

		let filter = { 
						Ascending: 0,
						PageIndex: 1,
						BoxType: (boxtype == huawei4G.sms_box.inbox || 
								  boxtype == huawei4G.sms_box.sent || 
								  boxtype == huawei4G.sms_box.drafts) ? boxtype : huawei4G.sms_box.inbox ,
    	                ReadCount: max_messages > 0 ? max_messages : 20, // how many messages to return
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

			cbSuccess( msgs )
		});
}
