/**
 * My own module for Huawei4G
 *
 * William Sengdara ~ June 2019
 */
function huawei4G(){
		this.routes = { 
							init:                '',
							error:				 'api/device/usb-tethering-switch',
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
					 };

		this.errors = {
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

module.exports = huawei4G
