/**
 * My own module for Huawei4G E5186s-22a
 *
 * William Sengdara ~ June 2019
 */

/*
	var log = {}
	log.error = function(d){ console.log(d) }
	log.debug = log.error
	log.trace = log.error
*/
function huawei4G(){
		this.router_ip = 'http://192.168.8.1'
	
		this.login  = {
					   	user: 'admin',
					    password: 'set_your_password',
						password_type: '4'
					  }

		this.sms_box = { 
							inbox: 1,
							sent: 2,
							drafts: 3
						}
		this.routes = { 
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

					 }

		this.errors = {
						 100002: "ERROR_SYSTEM_NO_SUPPORT",
						 100003: "ERROR_SYSTEM_NO_RIGHTS",
						 100004: "ERROR_SYSTEM_BUSY",
						 100005: "ERROR_NOT_DEFINED_YET",
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

		this.getHeaderValue = function( headers, key ){
				switch (key){
					case 'set-cookie':
						return headers['set-cookie'][0].split(';')[0]
						break;

					default:
						return headers[key];
						break;
				}
		}

		this.base64EncodeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
		this.base64DecodeChars = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 
									-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 
									-1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 
									55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 
									4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 
									23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 
									34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 
									51, -1, -1, -1, -1, -1];

		this.SHA256 = function( s ){
						var chrsz   = 8;
						var hexcase = 0;

						function safe_add (x, y) {
							var lsw = (x & 0xFFFF) + (y & 0xFFFF);
							var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
							return (msw << 16) | (lsw & 0xFFFF);
						}

						function S (X, n) { return ( X >>> n ) | (X << (32 - n)); }
						function R (X, n) { return ( X >>> n ); }
						function Ch(x, y, z) { return ((x & y) ^ ((~x) & z)); }
						function Maj(x, y, z) { return ((x & y) ^ (x & z) ^ (y & z)); }
						function Sigma0256(x) { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }
						function Sigma1256(x) { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }
						function Gamma0256(x) { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }
						function Gamma1256(x) { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }

						function core_sha256 (m, l) {
							var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
							var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
							var W = new Array(64);
							var a, b, c, d, e, f, g, h, i, j;
							var T1, T2;

							m[l >> 5] |= 0x80 << (24 - l % 32);
							m[((l + 64 >> 9) << 4) + 15] = l;

							for ( var i = 0; i<m.length; i+=16 ) {
								a = HASH[0];
								b = HASH[1];
								c = HASH[2];
								d = HASH[3];
								e = HASH[4];
								f = HASH[5];
								g = HASH[6];
								h = HASH[7];

								for ( var j = 0; j<64; j++) {
									if (j < 16) W[j] = m[j + i];
									else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);

									T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
									T2 = safe_add(Sigma0256(a), Maj(a, b, c));

									h = g;
									g = f;
									f = e;
									e = safe_add(d, T1);
									d = c;
									c = b;
									b = a;
									a = safe_add(T1, T2);
								}

								HASH[0] = safe_add(a, HASH[0]);
								HASH[1] = safe_add(b, HASH[1]);
								HASH[2] = safe_add(c, HASH[2]);
								HASH[3] = safe_add(d, HASH[3]);
								HASH[4] = safe_add(e, HASH[4]);
								HASH[5] = safe_add(f, HASH[5]);
								HASH[6] = safe_add(g, HASH[6]);
								HASH[7] = safe_add(h, HASH[7]);
							}
							return HASH;
						}

						function str2binb (str) {
							var bin = Array();
							var mask = (1 << chrsz) - 1;
							for(var i = 0; i < str.length * chrsz; i += chrsz) {
								bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i%32);
							}
							return bin;
						}

						function Utf8Encode(string) {
							string = string.replace(/\r\n/g,"\n");
							var utftext = "";

							for (var n = 0; n < string.length; n++) {

								var c = string.charCodeAt(n);

								if (c < 128) {
									utftext += String.fromCharCode(c);
								}
								else if((c > 127) && (c < 2048)) {
									utftext += String.fromCharCode((c >> 6) | 192);
									utftext += String.fromCharCode((c & 63) | 128);
								}
								else {
									utftext += String.fromCharCode((c >> 12) | 224);
									utftext += String.fromCharCode(((c >> 6) & 63) | 128);
									utftext += String.fromCharCode((c & 63) | 128);
								}
							}
							return utftext;
						}

						function binb2hex (binarray) {
							var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
							var str = "";
							for(var i = 0; i < binarray.length * 4; i++) {
								str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
								hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
							}
							return str;
						}

						s = Utf8Encode(s);
						return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
					}
		this.base64encodePasswordType4 = function ( username, pwd, token ) {
												return this.base64encode( this.SHA256(username + this.base64encode(this.SHA256(pwd)) + token) )
											}

		this.base64encode = function (str) {
								var out, i, len;
								var c1, c2, c3;
								len = str.length;
								i = 0;
								out = '';
								while (i < len) {
									c1 = str.charCodeAt(i++) & 0xff;
									if (i == len) {
										out += this.base64EncodeChars.charAt(c1 >> 2);
										out += this.base64EncodeChars.charAt((c1 & 0x3) << 4);
										out += '==';
										break;
									}
									c2 = str.charCodeAt(i++);
									if (i == len) {
										out += this.base64EncodeChars.charAt(c1 >> 2);
										out += this.base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
										out += this.base64EncodeChars.charAt((c2 & 0xF) << 2);
										out += '=';
										break;
									}
									c3 = str.charCodeAt(i++);
									out += this.base64EncodeChars.charAt(c1 >> 2);
									out += this.base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
									out += this.base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
									out += this.base64EncodeChars.charAt(c3 & 0x3F);
								}
								return out;
							}
}

module.exports = huawei4G
