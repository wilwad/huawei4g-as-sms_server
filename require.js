var XML = require('./xml')
var h4g = require('./huawei4G')

var xml = new XML()
console.log(xml.getXMLtype("<response>He's got a mole on his balls.</response>"))

var huawei4g = new h4g()
console.log(huawei4g.routes)

