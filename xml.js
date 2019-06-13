function xml(){
		this.getXMLtype = function(xml){
			xml = xml.replace(/(\r\n|\n|\r)/gm,"");
			return xml.indexOf('<error>') >-1 ? 'error' : xml.indexOf('<response>')>-1 ? 'response' : 'unknown';
		}

		/* 
		 * flatten an XML string 
		 * into a Javascript key-value pair object 
		 */
		this.getObjectFromXML = function(xml){
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
}

module.exports = xml
