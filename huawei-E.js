/* Disable need login */
g_needToLogin = 0;
g_logoutTimer = 0;

clearTimeout(g_logoutTimer);

// enable right-click
document.oncontextmenu = null;

var timing = function(){ return new Date().toLocaleString(); }

function getAjaxToken() {
	console.log(timing(), `getAjaxDataToken`);

	/*
	var m_ = document.querySelectorAll('meta');
	for (let m in m_){
		if (m_[m].name == 'csrf_token') console.log(m, m_[m].name, m_[m].content)
	}
	*/
	var meta = $("meta[name=csrf_token]");
	var i = 0;
		
	if(meta.length > 0) {
	    g_requestVerificationToken = [];
        for(i; i < meta.length; i++) {
            g_requestVerificationToken.push(meta[i].content);  
        }
	} 
	else {
		console.log(timing(), `getAjaxData('api/webserver/token'`);

	    getAjaxData('api/webserver/token', function($xml) {
            var ret = xml2object($xml);
            if ('response' == ret.type) {
                g_requestVerificationToken = ret.response.token;
            }
        }, {
            sync: true
        });
	}
	
}

/* LOGIN stuff */
function SHA256(s){

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

function base64encode(str) {
    var out, i, len;
    var c1, c2, c3;
    len = str.length;
    i = 0;
    out = '';
    while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len) {
            out += g_base64EncodeChars.charAt(c1 >> 2);
            out += g_base64EncodeChars.charAt((c1 & 0x3) << 4);
            out += '==';
            break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len) {
            out += g_base64EncodeChars.charAt(c1 >> 2);
            out += g_base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            out += g_base64EncodeChars.charAt((c2 & 0xF) << 2);
            out += '=';
            break;
        }
        c3 = str.charCodeAt(i++);
        out += g_base64EncodeChars.charAt(c1 >> 2);
        out += g_base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += g_base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        out += g_base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
}

function base64_encode (input) {
    _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
    input = _utf8_encode(input);
    while (i < input.length) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output = output +
        this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
        this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
    }
    return output;
}
function  _utf8_encode(string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";
    for (var n = 0; n < string.length; n++) {
        var c = string.charCodeAt(n);
        if (c < 128) {
            utftext += String.fromCharCode(c);
        } else if((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
        } else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
        }
    }
    return utftext;
}
function validateInput(username, password) {
    clearAllErrorLabel();
    var validate = true;
    if (username == '') {
        showErrorUnderTextbox('username', settings_hint_user_name_empty);
        $("#username").focus();
        $("#username").val("");
        return false;
    }
    if (password == '' && username != '') {
        showErrorUnderTextbox('password', dialup_hint_password_empty);
        $("#password").focus();
        $("#password").val("");
        return false;
    }
    if (!checkInputChar(username)) {
        showErrorUnderTextbox("password", IDS_login_username_password_wrong);
        $("#username").focus();
        $("#username").val("");
        $("#password").val("");
        return false;
    }
    return validate;
}

// g_password_type = 4
function login(destnation, callback, redirectDes) {
	var name = 'admin';
	var pwd  = 'Admin.2018!';
	var psd = '';
	g_password_type = 4;

	if($.isArray(g_requestVerificationToken)) { 
        if(g_requestVerificationToken.length > 0) {
             if(g_password_type == '4') {
                psd = base64encode(SHA256(name + base64encode(SHA256(pwd)) + g_requestVerificationToken[0]));    
             }
             else {
                psd = base64encode(pwd);
             }
             
        } else {
            setTimeout(function () {
                if(g_requestVerificationToken.length > 0) {
                    login(destnation, callback, redirectDes);
                }
            }, 50)
            return;
        }
    } else {
        psd = base64encode(pwd);
    }
	 
	var request = {
		Username: name,
		Password: psd,
		password_type: g_password_type
	};
    var valid = true; // validateInput(request.Username, request.Password);
    if (valid) {
        var xmlstr = object2xml('request', request);
        console.log('xmlstr = ' + xmlstr);
        saveAjaxData('api/user/login', xmlstr, function($xml) {
            console.log('api/user/login successed!');
            var ret = xml2object($xml);
            if (isAjaxReturnOK(ret)) {
                /*
                 * show username when login successfully
                 */
                $('#username_span').text(name);
                $('#username_span').show();
                $('#logout_span').text(common_logout);
                var passwordStr = $('#password').val();
                clearDialog();
                g_main_displayingPromptStack.pop();
                startLogoutTimer(redirectDes);
                if(checkPWRemind(passwordStr)) {
                    showPWRemindDialog(destnation, callback);
                } else {
                    loginSwitchDoing(destnation, callback);
                }

            } else {
                if (ret.type == 'error') {
                    clearAllErrorLabel();
                    if (ret.error.code == ERROR_LOGIN_PASSWORD_WRONG) {
                        showErrorUnderTextbox('password', system_hint_wrong_password);
                        $('#password').val('');
                        $('#password').focus();
                    } else if (ret.error.code == ERROR_LOGIN_ALREADY_LOGIN) {
                        showErrorUnderTextbox('password', common_user_login_repeat);
                        $('#username').focus();
                        $('#username').val('');
                        $('#password').val('');
		    } else if (ret.error.code == ERROR_LOGIN_USERNAME_PWD_TWO) {
                        showErrorUnderTextbox('password', common_user_login_repeat);
                        $('#username').focus();
                        $('#username').val('');
                        $('#password').val('');
                    } else if (ret.error.code == ERROR_LOGIN_USERNAME_WRONG) {
                        showErrorUnderTextbox('username', settings_hint_user_name_not_exist);
                        $('#username').focus();
                        $('#username').val('');
                        $('#password').val('');
                    } else if (ret.error.code == ERROR_LOGIN_USERNAME_PWD_WRONG) {
                        showErrorUnderTextbox('password', IDS_login_username_password_wrong);
                        $('#username').focus();
                        $('#username').val('');
                        $('#password').val('');
                    } else if (ret.error.code == ERROR_LOGIN_USERNAME_PWD_ORERRUN) {
                        showErrorUnderTextbox('password', IDS_login_username_password_input_overrun);
                        $('#username').focus();
                        $('#username').val('');
                        $('#password').val('');
                    }
                }
            }
        },{
        	enc:true
        });
    }
} login()

function loginSwitchDoing(destnation, callback) {
    if (typeof(destnation) != 'undefined' &&
    destnation != null) {
        window.location.href = destnation;
    }

    if (typeof (callback) == 'function') {
        callback();
        callback = null;
    }

    if(g_is_network_connect) {
        g_is_network_connect = false;
        index_sendNetWorkAction();
    } else if(g_is_wlan_connect) {
        g_is_wlan_connect = false;
        setHandoverSetting();
    } else if(g_is_power_off) {
        g_is_power_off = false;
        setPowerOff();
    }

    if (g_is_disconnect_clicked) {
        index_clickDisconnectBtn();
    } else if (g_is_connect_clicked) {
        index_clickConnectBtn();
    }
    if(g_isTrunOffWlanChecked) {
        if($('.trun_on_off_waln :checked').size() > 0) {
            g_handover_setting.Handover = '2';
        } else {
            g_handover_setting.Handover = '0';
        }
        g_isTrunOffWlanChecked = false;
        setHandoverSetting();
    }

}

function checkPWRemind(passValue) {
    var ret = false;
    if(checkPWStrength(passValue) == MACRO_PASSWORD_LOW) {
        getAjaxData('api/user/remind', function($xml) {
            var res = xml2object($xml);
            if ('response' == res.type && "0" == res.response.remindstate) {
                ret = true;
            }
        }, {
            sync: true
        });
    }
    return ret;
}

function setPWRemindStatus(setStatus) {
    var submitData = {
        remindstate:setStatus
    };
    var res = object2xml('request', submitData);
    saveAjaxData('api/user/remind', res, function($xml) {
        var return_ret = xml2object($xml);
        if (isAjaxReturnOK(return_ret)) {
            log.debug('main : send setPWRemindStatus success.');
        }
    }, {
        sync: true
    });
}

function checkPWStrength(passValue) {
    function charMode(iN) {
        if (iN>=48 && iN <=57) {
            return 1;
        } else if ((iN>=65 && iN <=90) || (iN>=97 && iN <=122)) {
            return 2;
        } else {
            return 4;
        }
    }

    function bitTotal(num) {
        var modes=0;
        var i = 0;
        for (i=0;i<3;i++) {
            if (num & 1) {
                modes++;
            }
            num>>>=1;
        }
        return modes;
    }

    var ret = 0;
    var sPWLength = passValue.length;
    var sPWModes = 0;
    var i= 0;
    for (i= 0; i < sPWLength; i++) {
        sPWModes|=charMode(passValue.charCodeAt(i));
    }
    sPWModes = bitTotal(sPWModes);

    if(sPWLength < 6 || (sPWModes == 1 && sPWLength < 10)) {
        ret = MACRO_PASSWORD_LOW;
    } else if((sPWModes == 2 && sPWLength >= 6) || (sPWModes == 1 && sPWLength >= 10)) {
        ret = MACRO_PASSWORD_MID;
    } else if(sPWModes == 3 && sPWLength >= 6) {
        ret = MACRO_PASSWORD_HIG;
    } else {
        ret = MACRO_PASSWORD_LOW;
    }
    if(2 == arguments.length){
        if(!String(passValue).localeCompare(arguments[1]) || !String(passValue).localeCompare(arguments[1].split("").reverse().join(""))){
            ret = MACRO_PASSWORD_LOW;
        } 
    }
    return ret;
}

function showPWRemindDialog(destnation,callback) {
    var dialogHtml = '';
    if ($('#div_wrapper').size() < 1) {
        dialogHtml += "<div id='div_wrapper'><iframe   id='ifream_dialog'  src= '' frameborder= '0' style= 'background:#bcbcbc; position:absolute; width:100%; height:100%; z-index:-1; display: block;'> </iframe></div>";
    }
    dialogHtml += "<div class='dialog'>";
    dialogHtml += "    <div class='dialog_top'></div>";
    dialogHtml += "    <div class='dialog_content'>";
    dialogHtml += "        <div class='dialog_header'>";
    dialogHtml += "            <span class='dialog_header_left clr_white'>" + common_note + '</span>';
    dialogHtml += "            <span class='dialog_header_right'><a class='dialog_close_btn clr_gray' href='javascript:void(0);' title='' id='psw_close_btn' class='clr_gray'><img src='../res/dialog_close_btn.png' title='' alt='' /></a></span>";
    dialogHtml += "        </div>";
    dialogHtml += "        <div class='dialog_table'>" + IDS_psw_login_remind  + "</div>";
    dialogHtml += "        <div class='dialog_table'><input type='checkbox'  id='check_pass_remind' /><span>&nbsp;" + IDS_psw_modify_remind + "</span></div>";
    dialogHtml += "        <div class='dialog_table_bottom'>";
    dialogHtml += "            <div class='dialog_table_r'>";
    dialogHtml += "                <span class='button_wrapper pop_confirm' id='psw_confirm'>";
    dialogHtml += "                    <span class='button_left'>";
    dialogHtml += "                        <span class='button_right'>";
    dialogHtml += "                            <span class='button_center clr_bold_a'><a href='javascript:void(0);' title=''>" + common_confirm + '</a></span>';
    dialogHtml += "                </span></span></span>";
    dialogHtml += "&nbsp;&nbsp;&nbsp;&nbsp;<span class='button_wrapper' id='psw_Cancel'>";
    dialogHtml += "                <span class='button_left'>";
    dialogHtml += "                    <span class='button_right'>";
    dialogHtml += "                        <span class='button_center clr_bold_a'><a href='javascript:void(0);' title=''>" + common_cancel + "</a></span>";
    dialogHtml += "                </span></span></span>";
    dialogHtml += "            </div>";
    dialogHtml += "        </div>";
    dialogHtml += "    </div>";
    dialogHtml += "    <div class='dialog_bottom'></div>";
    dialogHtml += "</div>";

    $('#psw_confirm, #psw_Cancel, #psw_close_btn').die('click');
    $('#psw_confirm').live('click', function() {
        if($('#check_pass_remind').get(0).checked) {
            setPWRemindStatus(MACRO_PASSWORD_REMIND_OFF);
        }
        clearDialog();
        loginSwitchDoing(destnation, callback);
        g_main_displayingPromptStack.pop();
        hiddenSelect(false);
        window.location.href = 'modifypassword.html';  
        return false;
    });
    $('#psw_Cancel,#psw_close_btn').live('click', function() {
        if($('#check_pass_remind').get(0).checked) {
            setPWRemindStatus(MACRO_PASSWORD_REMIND_OFF);
        }
        clearDialog();
        loginSwitchDoing(destnation, callback);
        g_main_displayingPromptStack.pop();
        hiddenSelect(false);
        return false;
    });
    $('.body_bg').before(dialogHtml);
    hiddenSelect(true);
    reputPosition($('.dialog'), $('#div_wrapper'));
    g_main_displayingPromptStack.push('psw_confirm');
    disableTabKey();
}

function userOut(destnation) {
    var logOut = {
        Logout: 1
    };

    var submitData = object2xml('request', logOut);
    saveAjaxData('api/user/logout', submitData, function($xml) {
        var ret = xml2object($xml);
        if (ret.type == 'response') {
            if (isAjaxReturnOK(ret)) {
                $("#username_span").hide();
                $("#logout_span").text(common_login);
                if (checkInputValue(destnation)) {
                    gotoPageWithoutHistory(destnation);
                } else {
                    gotoPageWithoutHistory(HOME_PAGE_URL);
                }

            }
        }
    });
}

function cancelLogoutTimer() {
    if (g_needToLogin) {
        clearTimeout(g_logoutTimer);
		//judgeAndPostHeartBeatRequest();
    }
}

/*
 * display login status(login or logout) after check login state
*/

getAjaxData('api/user/state-login', function($xml) {
    var ret = xml2object($xml);
    if (ret.type == 'response') {
        g_password_type = ret.response.password_type; 
        if (ret.response.State != 0) { //logout
			console.log('Logged out')
        } else //login
        {
			console.log('Logged in')
        }

    }
}, {
    sync: true
});

function showDialog(common_title,content,button1_text,button1_Id,button2_text,button2_Id) {
	console.log('showDialog called');
	common_title = "Time to Login";
    $('#div_wrapper').remove();
    $('.login_dialog').remove();
    var dialogHtml = '';
    if($('#div_wrapper').size() < 1) {
        dialogHtml += "<div id='div_wrapper'><iframe   id='ifream_dialog'  src= '' frameborder= '0' style= 'background:#bcbcbc; position:absolute; width:100%; height:100%; z-index:-1; display: block;'> </iframe></div>";
    }
    dialogHtml += "<div class='login_dialog' id='dialog'>";
    dialogHtml += "    <div class='login_dialog_top'></div>";
    dialogHtml += "    <div class='login_dialog_content'>";
    dialogHtml += "        <div class='login_dialog_header'>";
    dialogHtml += "            <span class='dialog_header_left clr_white'>" + common_title + '</span>';
    dialogHtml += "            <span class='dialog_header_right'><a class='dialog_close_btn clr_gray' title='' href='javascript:void(0);'><img src='../res/dialog_close_btn.png' title='' alt='' /></a></span>";
    dialogHtml += '        </div>';
    dialogHtml += content;
    dialogHtml += "        <div class='login_dialog_table_bottom'>";
    dialogHtml += "              <span class='button_wrapper pop_save' id='"+button1_Id+"'>";
    dialogHtml += "                  <span class='button_left'>";
    dialogHtml += "                      <span class='button_right'>";
    dialogHtml += "                            <span class='button_center clr_bold_a'><a href='javascript:void(0);' title=''>" + button1_text + '</a></span>';
    dialogHtml += '                      </span></span></span>';
    dialogHtml += "              <span class='button_wrapper' id='"+button2_Id+"'>";
    dialogHtml += "                  <span class='button_left'>";
    dialogHtml += "                      <span class='button_right'>";
    dialogHtml += "                            <span class='button_center clr_bold_a'><a href='javascript:void(0);' title=''>" + button2_text + '</a></span>';
    dialogHtml += '                      </span></span></span>';
    dialogHtml += '        </div>';
    dialogHtml += '    </div>';
    dialogHtml += "    <div class='login_dialog_bottom'></div>";
    dialogHtml += '</div>';
    $('.body_bg').before(dialogHtml);
    reputPosition($('#dialog'), $('#div_wrapper'));
    g_main_displayingPromptStack.push(button1_Id);
    disableTabKey();
}

function getLoginStatus(callback, redirectDes) {
    var flag = true;
    if (g_needToLogin) {
        getAjaxData('api/user/state-login', function($xml) {
            var ret = xml2object($xml);
            if (ret.type == 'response') {
                g_password_type = ret.response.password_type; 
                if (ret.response.State != 0) { //logout
                    $('#pop_login').die();
                    $('#pop_login').live('click', function() {
                        login(g_destnation, callback, redirectDes);
                    });
                    flag = false;
                    showloginDialog();
                }
            }
        }, {
            sync: true
        });
    }

    return flag;
}

// show login dialog if not logged in
getAjaxData('api/user/state-login', function($xml) {
    var ret = xml2object($xml);
    if (ret.type == 'response') {
        if (ret.response.State != '0') { //logout
            g_destnation = g_nav.children().first().attr('href');
            g_nav.children().first().attr('href', 'javascript:void(0);');
            showloginDialog();
        }

    }
}, {
    sync: true
});

function loginout() {
    getAjaxData('api/user/state-login', function($xml) {
        var ret = xml2object($xml);
        if (ret.type == 'response') {
            if (ret.response.State != 0) { //logout
                showloginDialog();
            } else //login
            {
                showConfirmDialog(common_warning_logout, function() {
                    userOut();
                    cancelLogoutTimer();
                    return false;
                }, function() {
                });
            }
        }
    }, {
        sync: true
    });
}

/*************Get and save data (end)**************/
/***************Get and save data (begin)******/

// urlstr : URL of the Restful interface.
// callback_func : Callback function to handle response, this callback function
// have one parameter
// callback_func($xml) - $xml : a jQuery XML object which is successfully get
// from getAjaxData.
// options.sync
// options.timout
// options.errorCB
function getAjaxData(urlstr, callback_func, options) {
    var myurl = AJAX_HEADER + urlstr + AJAX_TAIL;
    var isAsync = true;
    var nTimeout = AJAX_TIMEOUT;
    var errorCallback = null;

    if (options) {
        if (options.sync) {
            isAsync = (options.sync == true) ? false : true;
        }
        if (options.timeout) {
            nTimeout = parseInt(options.timeout, 10);
            if (isNaN(nTimeout)) {
                nTimeout = AJAX_TIMEOUT;
            }

        }
        errorCallback = options.errorCB;
    }
    var headers = {};
    if(!($.isArray(g_requestVerificationToken))) {
	   headers['__RequestVerificationToken'] = g_requestVerificationToken;
	}
	
	$.ajax({
		async: isAsync,
		headers: headers,
		//cache: false,
		type: 'GET',
		timeout: nTimeout,
		url: myurl,
		//dataType: ($.browser.msie) ? "text" : "xml",
		error: function(XMLHttpRequest, textStatus) {
			try {
				if (jQuery.isFunction(errorCallback)) {
					errorCallback(XMLHttpRequest, textStatus);
				}
				log.error('MAIN : getAjaxData(' + myurl + ') error.');
				log.error('MAIN : XMLHttpRequest.readyState = ' + XMLHttpRequest.readyState);
				log.error('MAIN : XMLHttpRequest.status = ' + XMLHttpRequest.status);
				log.error('MAIN : textStatus ' + textStatus);
			} catch (exception) {
				log.error(exception);
			}
		},
		success: function(data) {
			log.debug('MAIN : getAjaxData(' + myurl + ') sucess.');
			log.trace(data);
			var xml;
			if (typeof data == 'string' || typeof data == 'number') {
				if((-1 != this.url.indexOf('/api/ussd/get') )&&( -1 != data.indexOf("content"))) {
					data = smsContentDeleteWrongChar(data);
				}
				if (!window.ActiveXObject) {
					var parser = new DOMParser();
					xml = parser.parseFromString(data, 'text/xml');
				} else {
					//IE
					xml = new ActiveXObject('Microsoft.XMLDOM');
					xml.async = false;
					xml.loadXML(data);
				}
			} else {
				xml = data;
			}
			var ret = xml2object($(xml));
			if('error' == ret.type) {
				if(ERROR_WRONG_SESSION_TOKEN == ret.error.code) {
						log.error('Main: getajax'+ this.url +'session token error');
						gotoPageWithoutHistory(HOME_PAGE_URL);
						return;
					}
					
				if(ERROR_WRONG_SESSION == ret.error.code) {
					log.error('Main: getajax'+ this.url +'session  error');
					gotoPageWithoutHistory(HOME_PAGE_URL);
					return;
				}
			}			
			if('error' == ret.type && ERROR_WRONG_TOKEN == ret.error.code) {
				getAjaxToken();
				getAjaxData(urlstr, callback_func, options);
			} else if (typeof callback_func == 'function') {
				callback_func($(xml));
			} else {
				log.error('callback_func is undefined or not a function');
			}
		}
	});
}

/* Send SMS */
var send_sms = function(phoneArray, messageContent){
					if (! g_requestVerificationToken || !g_requestVerificationToken.length || g_requestVerificationToken.length == 0){
						console.log('I need a verification token. will getAjaxToken()');

						getAjaxToken();

						if (! g_requestVerificationToken || !g_requestVerificationToken.length || g_requestVerificationToken.length == 0){
							console.log('I called getAjaxToken() but got nuffing!');
							return;
						}
						
					}
						var scaValue = "";
						messageContent =  resolveXMLEntityReference(messageContent);
						let SMS_BOXTYPE_DRAFT = 3;
						let g_sms_boxType = 1;
						let g_text_mode = 1;
						let sms_systemBusy = 113018;
						var index = -1;
						if(SMS_BOXTYPE_DRAFT == g_sms_boxType && smsIndex>-1) {
							index = smsIndex;
							smsIndex = -1;
						}
						function pad(data){ 
									if (data.toString().length == 2) 
										return data; 
									else 
										return '0'+data; 
						}

						var dt = new Date();
						var now = dt.getFullYear() + '-' + 
								  pad(dt.getMonth()) + '-' + 
                                  pad(dt.getDate()) + ' ' + 
                                  pad(dt.getHours()) + ':'+ 
                                  pad(dt.getMinutes()) + ':'+ 
                                  pad(dt.getSeconds());

						var submitXmlObject = {
							Index:index,
							Phones: {
								Phone: phoneArray
							},
							Sca:scaValue,
							Content:messageContent,
							Length:messageContent.length,
							Reserved:g_text_mode,
							Date:now
						};
						smsIndex = -1;
						var submitData = object2xml("request", submitXmlObject);

						console.log(submitData)

						console.log('1', g_requestVerificationToken);

						saveAjaxData("api/sms/send-sms", submitData, function($xml) {
								var ret = xml2object($xml);

								console.log('2', g_requestVerificationToken);

								if(ret.type=='error') {
									console.log('Return type: error');

									if(sms_systemBusy == ret.error.code) {
										console.log('System busy');
									} else {
										console.log('SMS Send failed');
									}
									return false;

								} else {
										console.log('SMS was sent OK');
										return true;
								}
						});
}

// urlstr : URL of the Restful interface.
// xml: xml string to be submit to server.
// callback_func : Callback function to handle response, this callback function
// have one parameter
// callback_func($xml) - $xml : a jQuery XML object which is successfully get
// from getAjaxData.
// options.sync
// options.timout
// options.errorCB

// target = http://192.168.8.1
// AJAX_HEADER = '../';
// AJAX_TAIL = "";
// AJAX_TIMEOUT = 30000
function saveAjaxData(urlstr, xmlDate, callback_func, options) {
    var myurl = AJAX_HEADER + urlstr + AJAX_TAIL;
    var isAsync = true;
    var nTimeout = AJAX_TIMEOUT;
    var errorCallback = null;

	var headers = {};
    if($.isArray(g_requestVerificationToken)) {
        if(g_requestVerificationToken.length > 0) {
            headers['__RequestVerificationToken'] = g_requestVerificationToken[0];
            g_requestVerificationToken.splice(0, 1);
        } else {
            setTimeout(function () {
				saveAjaxData(urlstr, xmlDate, callback_func, options);
            }, 50);
            return;
        }
        
    } else {
       headers['__RequestVerificationToken'] = g_requestVerificationToken;
    }    
    if (options) {
        if (options.sync) {
            isAsync = (options.sync == true) ? false : true;
        }
        if (options.timeout) {
            nTimeout = parseInt(options.timeout, 10);
            if (isNaN(nTimeout)) {
                nTimeout = AJAX_TIMEOUT;
            }
        }
        errorCallback = options.errorCB;
        if (options.enc && g_moduleswitch.encrypt_enabled == 1) {
            headers['encrypt_transmit'] = 'encrypt_transmit';
            xmlDate = doRSAEncrypt(xmlDate);
        } else if(options.enp && g_moduleswitch.encrypt_enabled == 1) {
            headers['part_encrypt_transmit'] = options.enpstring;
        }
     }

	console.log('headers', headers)
	console.log('xmldate',xmlDate)

    $.ajax({
        async: isAsync,
        headers: headers,
        //cache: false,
        type: 'POST',
        timeout: nTimeout,
        url: myurl,
        // dataType: ($.browser.msie) ? "text" : "xml",
        data: xmlDate,
        error: function(XMLHttpRequest, textStatus) {
            try {
                if (jQuery.isFunction(errorCallback)) {
                    errorCallback(XMLHttpRequest, textStatus);
                }
                log.error('MAIN : saveAjaxData(' + myurl + ') error.');
                log.error('MAIN : XMLHttpRequest.readyState = ' + XMLHttpRequest.readyState);
                log.error('MAIN : XMLHttpRequest.status = ' + XMLHttpRequest.status);
                log.error('MAIN : textStatus' + textStatus);
            } catch (exception) {
                log.error(exception);
            }
        },
        success: function(data) {
            log.debug('MAIN : saveAjaxData(' + myurl + ') success.');
            log.trace(data);
            var xml;
            if (typeof data == 'string') {
                if (-1 != this.url.indexOf('/api/sms/sms-list') && -1 != data.indexOf('Messages')) {
                    data = smsContentDeleteWrongChar(data);
                }
                if (!window.ActiveXObject) {
                    var parser = new DOMParser();
                    xml = parser.parseFromString(data, 'text/xml');
                } else {
                    //IE
                    xml = new ActiveXObject('Microsoft.XMLDOM');
                    xml.async = false;
                    xml.loadXML(data);
                }
            } else {
                xml = data;
            }
            var xml_ret = xml2object($(xml));
            if(typeof xml_ret.error != 'undefined' && -1 == this.url.indexOf('/api/user/session')) {
                if(xml_ret.error.code == ERROR_SYSTEM_NO_RIGHTS && current_href != "home") {
                    gotoPageWithoutHistory(HOME_PAGE_URL);
                    return;
                }
                if(ERROR_VOICE_BUSY == xml_ret.error.code)
                {
                    gotoPageWithoutHistory(VOICE_BUSY_URL);
                    return;
                }
               
                if(ERROR_WRONG_TOKEN == xml_ret.error.code) {
                    getAjaxToken();
                    saveAjaxData(urlstr, xmlDate, callback_func, options);
		    return;
                }
				
				if(ERROR_WRONG_SESSION_TOKEN == xml_ret.error.code) {
				    log.error('Main: saveAjaxDate'+ this.url +'session token error');
                    gotoPageWithoutHistory(HOME_PAGE_URL);
                    return;
                }
                
                if(ERROR_WRONG_SESSION == xml_ret.error.code) {
                    log.error('Main: saveAjaxDate'+ this.url +'session  error');
                    gotoPageWithoutHistory(HOME_PAGE_URL);
                    return;
                }
			}
			else if(isAjaxReturnOK(xml_ret) && -1 != this.url.indexOf('/api/user/login')) {
			    log.debug('Main: login success, empty token list');
			    if($.isArray(g_requestVerificationToken)) {
			        g_requestVerificationToken = [];    
			    }
			}

			if (typeof callback_func == 'function') {
				callback_func($(xml));
			} else {
				log.error('callback_func is undefined or not a function');
			}
		}, 
        complete: function(XMLHttpRequest, textStatus) {
            var headers = XMLHttpRequest.getAllResponseHeaders();
            if(headers.indexOf('__RequestVerificationTokenone') > 0) {
                g_requestVerificationToken.push(getTokenFromHeader(headers, '__RequestVerificationTokenone'));
                if(headers.indexOf('__RequestVerificationTokentwo') > 0) {
                    g_requestVerificationToken.push(getTokenFromHeader(headers, '__RequestVerificationTokentwo'));
                }
            } 
            else if(headers.indexOf('__requestverificationtokenone') > 0) {
                g_requestVerificationToken.push(getTokenFromHeader(headers, '__requestverificationtokenone'));
                if(headers.indexOf('__requestverificationtokentwo') > 0) {
                    g_requestVerificationToken.push(getTokenFromHeader(headers, '__requestverificationtokentwo'));
                }
            }
            else if(headers.indexOf('__RequestVerificationToken') > 0) {
                g_requestVerificationToken.push(getTokenFromHeader(headers, '__RequestVerificationToken'));
            }
            else if(headers.indexOf('__requestverificationtoken') > 0) {
                g_requestVerificationToken.push(getTokenFromHeader(headers, '__requestverificationtoken'));
            }
            else {
                log.error('MAIN: saveAjaxData can not get response token');
            }
	    startLogoutTimer();
        }
	});
}

// return true if the AJAX response from server is <response>OK</response>
// obj: object came from $xml
function isAjaxReturnOK(obj) {
    var ret = false;
    if (obj) {
        if (typeof (obj.response) == 'string') {
            if (obj.response.toLowerCase() == 'ok') {
                ret = true;
            }
        }
    }
    return ret;
}

/* get list of sms */
var get_sms_list = function(pageIdx){
    g_sms_smsListArray.PageIndex = pageIdx;
    var msgCondition = object2xml("request",g_sms_smsListArray);
	console.log(msgCondition)

    saveAjaxData('api/sms/sms-list',msgCondition, function($xml) {
        var ret = xml2object($xml);
        if (ret.type == "response") {
            if(ret.response.Messages.Message) {
                g_finishFlag = 1;
                g_sms_smsList = new Array();
                if($.isArray(ret.response.Messages.Message)) {
                    g_sms_smsList = ret.response.Messages.Message;
                } else {
                    g_sms_smsList.push(ret.response.Messages.Message);
                }
                console.log(g_sms_smsList);
            } else {
                // showInfoDialog(common_failed);
                log.error("SMS: get api/sms/sms-list data error");
            }
        } else {
            // showInfoDialog(common_failed);
            log.error("SMS: get api/sms/sms-list data error");
        }
    }, {
        errorCB: function() {
            // showInfoDialog(common_failed);
            if(g_finishFlag == 0){
                sms_getBoxData();
                g_finishFlag = 1;
            }
            log.error("SMS: get api/sms/sms-list file failed");
        }
    });
}

//to show the sms store state and show the sms list
function sms_initPage() {
    if(!isButtonEnable("ref_msg_btn")) {
        return;
    }
    sms_getBoxCount();
    sms_initBoxCount();
    if(g_sms_curMsgSum > 0) {
        button_enable("ref_msg_btn","0");
        sms_initSMS();
    } else {
        g_sms_curMsgSum = 0;
        g_sms_recordMsgSum = 0;
    }
}


//get current box(inbox/sendbox/draftbox) sms
function sms_getBoxData() {
    g_sms_smsListArray.PageIndex = g_sms_pageIndex;
    var msgCondition = object2xml("request",g_sms_smsListArray);
	console.log(msgCondition)

    saveAjaxData('api/sms/sms-list',msgCondition, function($xml) {
        var ret = xml2object($xml);
        if (ret.type == "response") {
            if(ret.response.Messages.Message) {
                g_finishFlag = 1;
                g_sms_smsList = new Array();
                if($.isArray(ret.response.Messages.Message)) {
                    g_sms_smsList = ret.response.Messages.Message;
                } else {
                    g_sms_smsList.push(ret.response.Messages.Message);
                }

				console.log(g_sms_smsList)
                sms_initBoxList();
            } else {
                // showInfoDialog(common_failed);
               console.log("SMS: get api/sms/sms-list data error");
            }
        } else {
            // showInfoDialog(common_failed);
            console.log("SMS: get api/sms/sms-list data error");
        }
    }, {
        errorCB: function() {
            // showInfoDialog(common_failed);
            if(g_finishFlag == 0){
                sms_getBoxData();
                g_finishFlag = 1;
            }
            console.log("SMS: get api/sms/sms-list file failed");
        }
    });
}

function sms_initSMS() {
    sms_getBoxData();
    g_sms_recordMsgSum = g_sms_curMsgSum;
}

//function delete user checked sms
function sms_smsDelete() {
    cancelLogoutTimer();
    g_sms_checkedList = "";// be checked
    var beChecked = $("#sms_table :checkbox:gt(0):checked");
    beChecked.each( function() {
        g_sms_checkedList+="<Index>"+this.value+"</Index>";
    });
    var xmlstr = object2xml("request","<Index>40051</Index>"/* g_sms_checkedList*/);
    saveAjaxData("api/sms/delete-sms",xmlstr, function($xml) {
        var ret = xml2object($xml);
        startLogoutTimer();
        if(isAjaxReturnOK(ret)) {
            sms_initPage();
        }
    });
}

// get SMS list
//
// 1 - inbox
// 2 - sent
// 3 - drafts
var g_sms_smsListArray = 
{Ascending: 0, 
BoxType: 0, 
PageIndex: 0, 
ReadCount: 0, 
SortType: 0, 
UnreadPreferred: 0}

var boxType = 1, pageIdx = 0;
	console.log('fetch_sms_box', boxType, pageIdx)
    g_sms_smsListArray.BoxType = 1;
    g_sms_smsListArray.PageIndex = 1;
    var msgCondition = object2xml("request",g_sms_smsListArray);
	console.log(msgCondition)

    saveAjaxData('api/sms/sms-list',msgCondition, function($xml) {
        var ret = xml2object($xml);
		console.log('ret', ret)
        if (ret.type == "response") {
            if(ret.response.Messages.Message) {
                g_finishFlag = 1;
                g_sms_smsList = new Array();

                if($.isArray(ret.response.Messages.Message)) {
                    g_sms_smsList = ret.response.Messages.Message;
                } else {
                    g_sms_smsList.push(ret.response.Messages.Message);
                }
                console.log(g_sms_smsList);
            } else {
                // showInfoDialog(common_failed);
                console.error("SMS: get api/sms/sms-list data error");
            }
        } else {
            // showInfoDialog(common_failed);
            console.error("SMS: get api/sms/sms-list data error");
        }
    }, {
        errorCB: function() {
            // showInfoDialog(common_failed);
            if(g_finishFlag == 0){
                sms_getBoxData();
                g_finishFlag = 1;
            }
            console.error("SMS: get api/sms/sms-list file failed");
        }
    });

// get sms data
g_sms_smsListArray.PageIndex = 1;
g_sms_smsListArray.BoxType = 1;
g_sms_smsListArray.ReadCount = 50; // max
var msgCondition = object2xml("request",g_sms_smsListArray);
console.log(msgCondition)
saveAjaxData('api/sms/sms-list',msgCondition, function($xml) {
    var ret = xml2object($xml);
    if (ret.type == "response") {
		console.log(ret.response)
        if(ret.response.Messages.Message) {
            g_finishFlag = 1;
            g_sms_smsList = new Array();
            if($.isArray(ret.response.Messages.Message)) {
                g_sms_smsList = ret.response.Messages.Message;
            } else {
                g_sms_smsList.push(ret.response.Messages.Message);
            }
            console.log(g_sms_smsList);
        } else {
            // showInfoDialog(common_failed);
            console.log("SMS: get api/sms/sms-list data error");
        }
    } else {
        // showInfoDialog(common_failed);
        console.log("SMS: get api/sms/sms-list data error");
    }
}, {
    errorCB: function() {
        // showInfoDialog(common_failed);
        if(g_finishFlag == 0){
            sms_getBoxData();
            g_finishFlag = 1;
        }
        console.log("SMS: get api/sms/sms-list file failed");
    }
});
