var request = require('request');
const server    = 'http://192.168.8.1/'
var headers = {}

var huawei4G = {
	routes: { 
				init:                '', /* no params returns sessionid*/
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
    }
})
