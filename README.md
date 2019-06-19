# huawei4g-as-sms_server
Use a Huawei 4G E5186s-22a router as an SMS Server using Node

![Interface](https://github.com/wilwad/huawei4g-as-sms_server/blob/master/huawei-4g-router.jpg)

Apart from providing 4G internet connectivity, this router also has SMS receive and send capability.
Unfortunately you need to login to the web interface to read and compose text messages.
Javascript is used to talk to the router's API.

Here are the notable REST routes used by the router

init:                '',
error:				 'api/device/usb-tethering-switch',
user_state_login:    'api/user/state-login',
user_login:			 'api/user/login',
user_logout:         'api/user/logout',
get_token:           'api/webserver/token',
get_public_key:		 'api/webserver/publickey',
device_basic_info:   'api/device/basic_information',
device_full_info:	 'api/device/information',
check_notifications: 'api/monitoring/check-notifications',
plmn:                'api/net/current-plmn',
status:              'api/monitoring/status',
usb_tethering:       'api/device/usb-tethering-switch',
pin_status:          'api/pin/status',
sim_lock:			 'api/pin/simlock',
status_info:         'api/cradle/status-info',
wlan_basic_settings: 'api/wlan/basic-settings',
reboot_router:		 'api/device/control',
host_list:			 'api/wlan/host-list',
dhcp_settings:	 	 'api/dhcp/settings',
sms_count:			 'api/sms/sms-count', /* GET get the total # of messages available */
sms_list:			 'api/sms/sms-list', /* POST get sms list: BoxType, PageIndex, ReadCount */
sms_read:			 'api/sms/set-read', /* POST set sms_read: <Index>smsId</Index> */
sms_delete:			 'api/sms/delete-sms', /* POST delete sms: <Index>smsId</Index> */
sms_send:			 'api/sms/send-sms',
toggle_data:		 'api/dialup/mobile-dataswitch', /* GET | POST dataswitch:0|1 */

What would you use this for?

You can send an SMS from your application (e.g. bash). Get a list of received messages and auto respond on keywords.

Let's get started

huawei4G.js -- set the user and password for the router
huawei4G.websocket.server.js -- node huawei4G.websocket.server.js to start the test WebSocket Server
huawei4G.websocket.client.js -- node huawei4G.websocket.client.js to start the test WebSocket client. 
Type routes to get a list of the REST routes and specify some routes to get a response from the router.
E.g. api/wlan/basic-settings, would return


![Interface](https://github.com/wilwad/huawei4g-as-sms_server/blob/master/websocket-client-routes.png)


