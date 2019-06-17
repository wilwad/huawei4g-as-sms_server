var XML = require('./xml')
var xml = new XML()

var person = {name: 'William', surname: 'Sengdara'}
var work   = {title: 'Software Developer', languages: 'Javascript (Node JS), PHP', OS: 'Linux, MacOS, Windows'}

var person2 = {primary: person, secondary: work}
var str = `<?xml version="1.0" encoding="UTF-8"?><information>` + xml.objectToXML( person ) + '</information>'

//console.log( str)

console.log(xml.objectFromXML(str))
/*
<information>
	<primary>
		<name>William</name><surname>Sengdara</surname>
	</primary>
	<secondary>
		<title>Software Developer</title>
		<languages>Javascript (Node JS), PHP</languages>
		<OS>Linux, MacOS, Windows</OS>
	</secondary>
</information>
*/
