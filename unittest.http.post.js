let port = 8075
var http = require('http')
var XML = require('./xml')
var h4g = require('./huawei4G')
var xml = new XML()
var huawei4G = new h4g()

let url = 'http://192.168.8.1' // default 4G router IP

var requests = []
var cookie_  = ''

var headers_ = {}

console.log('Trying http.get')

http.get(url+'/'+huawei4G.routes.init, (res)=>{
	console.log('http.get', res.statusCode, http.STATUS_CODES[ res.statusCode ])
	console.log('http.get',res.headers)
})

console.log('Trying http.request')

const postData = JSON.stringify({
  'msg': 'Hello World!'
});

const options = {
  hostname: url,
  port: 80,
  //path: `/${huawei4G.routes.init}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();

/*
http.request(options, (error, response, data)=> {
    if (!error && response.statusCode == 200) {
		//console.log(response.headers)
		cookie_ = response.headers['set-cookie'][0].split(';')[0]

		if (! cookie_.trim().length) {
			console.log('* Failed to get sessionid from server. Bye')
			process.exit(1)
		}

		console.log('Got cookie OK')//cookie_);
		get_sms_list()
    }
})

function get_sms_list(){
		if (! cookie_.trim().length) {
			console.log('* Cookie monster need his cookie. Bye')
			process.exit(1)
			return
		}

		let route = 'api/sms/sms-list' //'api/webserver/token'// 

		options.url = `${url}/${route}`
		options.headers['Cookie'] = cookie_
		options.method = 'POST'
		options.qs = {}
		options.headers[ 'Content-Type' ] = 'text/html';

		let xmlStr = `<?xml version="1.0" encoding="UTF-8"?><request><Ascending>0</Ascending><BoxType>1</BoxType><PageIndex>1</PageIndex><ReadCount>20</ReadCount><SortType>0</SortType><UnreadPreferred>0</UnreadPreferred></request>`

		http.get({
			url: `${url}/${route}`,
			method: 'POST',
			body: xmlStr,
			headers:{
				'Cookie' : cookie_ ,
				'Content-Type': 'application/xml',
				'Access-Control-Allow-Headers': 'Content-Type, Access-Control-Allow-Origin'
			}
		}, (error, response, body)=>{
			let raw  = body.replace(/(\n\r|\n|\r|\t)/gm,"")
			let type = xml.getXMLtype(raw)
			let obj  = xml.getObjectFromXML(raw) 

			//console.log(response.toJSON())
			console.log(response.headers)//statusCode);
			console.log('Response.body:',raw);

			if ( type == 'error' && obj !== undefined ){
				console.log('Huawei4G error:', huawei4G.errors[ obj.code ] )
            }
			//console.log('error',error);
		});
}
*/
