function xml(){
		this.getType = function(xml){
			xml = xml.replace(/(\r\n|\n|\r)/gm,"").replace(/\t/gm,"");
			return xml.indexOf('<error>') >-1 ? 'error' : xml.indexOf('<response>')>-1 ? 'response' : 'unknown';
		}

		/* 
		 * flatten an XML string 
		 * into a Javascript key-value pair object 	
		 * Warning: very shallow. Specifically for parsing <error> and <response> xml from Huawei 4G api only!
		 */
		this.objectFromXML = function(xml){
			xml = xml.replace(/(\r\n|\n|\r)/gm,"").replace(/\t/gm,"") // remove newlines / carriage returns, tabs
			xml = xml.split(`?>`)[1] // remove: <?xml version="1.0" encoding="UTF-8"?>

			//console.log('xml', xml)

			var ret = {}
			let type = xml.indexOf('<error>') >-1 ? 'error' : xml.indexOf('<response>')>-1 ? 'response' : 'unknown';

			if ( type == 'error'){
				xml = xml.replace(/<error>/gm,"").replace(/<\/error>/gm,"");
			} else {
				xml = xml.replace(/<response>/gm,"").replace(/<\/response>/gm,"");
			}

			var arr = xml.split(/\<\/\w+>/gm).filter(function(el){ return el.trim().length }).map(function(el){ return el.replace("<","").split(">")});

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

		this.csrfTokensFromHTML = function(xml){
			xml = xml.replace(/(\r\n|\n|\r)/gm,"").replace(/\t/gm,"") // remove newlines / carriage returns, tabs
			xml = xml.split(`<head>`)[1] // remove: <html>
			xml = xml.split('<meta http-equiv=')[0]

			var tokens = [];
			var regex = /csrf_token/gi;

			while ( (result = regex.exec(xml)) ) {
				var token = xml.substr( "csrf_token\" content=\"".length+result.index).split("\"/>")[0]
				console.log(token, token.length)
				tokens.push(token)
			}
			return tokens.length ? tokens : undefined;
		}

		/*
         * Turn an object into xml
         */
		this.objectToXML = function( object ){
			var ret = '';
			var val = '';

            for (var key in object){
				val = object[ key ]

				if (typeof val !== 'string'){
					let v = this.objectToXML( val )
					ret += `<${key}>` + val + `</${key}>`					
				} else {
					ret += `<${key}>${val}</${key}>`
				}		
            }

			return ret;
		}
}

module.exports = xml
