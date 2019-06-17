var request = require('request');

const user_name = 'admin'
const user_pwd  = 'admin'
const server    = 'http://192.168.8.1/'

// Set the headers
var headers = {}

var huawei4G = {
	routes: { 
				error:				 'api/device/usb-tethering-switch',
				init:                '',
				user_state_login:    'api/user/state-login',
				user_logout:         'api/user/logout',
				get_token:           'api/webserver/token',
				device_basic:        'api/device/basic_information',
				check_notifications: 'api/monitoring/check-notifications',
				plmn:                'api/net/current-plmn',
				status:              'api/monitoring/status',
				usb_tethering:       'api/device/usb-tethering-switch',
				pin_status:          'api/pin/status',
				status_info:         'api/cradle/status-info',
				wlan_basic_settings: 'api/wlan/basic-settings',
			 },

    errors: {
				 100002: "ERROR_SYSTEM_NO_SUPPORT",
				 100003: "ERROR_SYSTEM_NO_RIGHTS",
				 100004: "ERROR_SYSTEM_BUSY",
				 108001: "ERROR_LOGIN_USERNAME_WRONG",
				 108002: "ERROR_LOGIN_PASSWORD_WRONG",
				 108003: "ERROR_LOGIN_ALREADY_LOGIN",
				 108006: "ERROR_LOGIN_USERNAME_PWD_WRONG",
				 108007: "ERROR_LOGIN_USERNAME_PWD_ORERRUN",
				 135001: "ERROR_LOGIN_USERNAME_PWD_TWO",
				 120001: "ERROR_VOICE_BUSY" ,
				 125001: "ERROR_WRONG_TOKEN" ,
				 125002: "ERROR_WRONG_SESSION",
				 125003: "ERROR_WRONG_SESSION_TOKEN" 
	}
}

var cookie_  = ''
var headers_ = {}

var options = {
    url: server + huawei4G.routes.init,
	headers: headers_,
    method: 'GET',
    qs: { }
}
request(options, function (error, response, data) {
    if (!error && response.statusCode == 200) {
		//console.log(response.headers)
		// get the cookie
		var cookie_ = response.headers['set-cookie'][0].split(';')[0]
		console.log('Our Cookie:', cookie_);

		var headers_ = {}
		headers_['Cookie'] = cookie_;

		var options = {
			url: server + huawei4G.routes.user_state_login,
			headers: headers_,
			method: 'GET',
			qs: { }
		}

		request(options, function (error, response, data) {
			if (!error && response.statusCode == 200) {
				//console.log(response.headers)
				var type  = getXMLtype(data)

				switch (type){
					case 'error':
						var ret   = getObjectFromXML(data); 
						var error = huawei4G.errors[ ret.code ];// ['code', 'message'];

						if ( error == undefined){
							console.log('Server Response: ', data);
						} else {
							console.log( error )			
						}
						break;

					default:
						let resp = getObjectFromXML(data);

						if (resp == undefined){
							console.log('getObjectFromXML failed')
							return;
						}

						if (resp.State){
							switch ( parseInt(resp.State)) {
								case -1: console.log('User not logged in'); break;
								default: console.log('User logged in')
							}
						}

						console.log(resp)
				}
			}
		})

    }
})

var getXMLtype = function(xml){
	xml = xml.replace(/(\r\n|\n|\r)/gm,"");
	return xml.indexOf('<error>') >-1 ? 'error' : xml.indexOf('<response>')>-1 ? 'response' : 'unknown';
}

/* 
 * flatten an XML string 
 * into a Javascript key-value pair object 
 */
var getObjectFromXML = function(xml){
	xml = xml.replace(/(\r\n|\n|\r)/gm,"") // remove newlines / carriage returns
	xml = xml.split(`?>`)[1] // remove: <?xml version="1.0" encoding="UTF-8"?>

	var ret = {}
	let type = xml.indexOf('<error>') >-1 ? 'error' : xml.indexOf('<response>')>-1 ? 'response' : 'unknown';

	if ( type == 'error'){
		xml = xml.replace(/<error>/gm,"").replace(/<\/error>/gm,"");
	} else {
		xml = xml.replace(/<response>/gm,"").replace(/<\/response>/gm,"");
	}

	var arr = xml.split(/\<\/\w+>/gm).filter(function(el){ return el.trim().length }).map(function(el){return el.replace("<","").split(">")});

	if (! Array.isArray(arr)){
		return undefined;
	}

	for(let idx = 0; idx < arr.length; idx++){
		let key = arr[idx][0];
		let val = arr[idx][1];
		ret[ key] = val;
	}

	return ret;
}

