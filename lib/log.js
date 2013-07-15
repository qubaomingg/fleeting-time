var logger = require('log'),
	env = require('./setting'),
	path = require('path'),
	fs = require('fs'),
	EMERGENCY = 0, DEBUG = 7, ERROR = 3, INFO = 6,
	writeOptions = {
		flags: 'a',
		encoding: 'utf8'
	}, logDIR = path.join(env.get('webroot'), '/log');
if(! fs.existsSync(logDIR)){
    fs.mkdirSync(logDIR);
}
var	errorLogStream = fs.createWriteStream(
		path.join(logDIR, '/error.log'),
		writeOptions
	),
	debugLogSteam = fs.createWriteStream(
		path.join(logDIR, '/debug.log'),
		writeOptions
	),
	fatalLogStream = fs.createWriteStream(
		path.join(logDIR, '/fatal.log'),
		writeOptions
	),
	fatalLogger = new logger(EMERGENCY, fatalLogStream),
	errorLogger = new logger(ERROR, errorLogStream),
	debugLogger = new logger(DEBUG, debugLogSteam);

function dataToString(data){
	var re = [], logString;
	for(var i=0, l=data.length;i<l;i++){
		re.push(JSON.stringify(data[i]));
	}
	logString = re.join(' ');
	return logString;
}

exports.fatal = function(){
	fatalLogger.emergency(dataToString(arguments));
}
exports.error = function(){
	errorLogger.error(dataToString(arguments));
}
exports.debug = function(){
	debugLogger.debug(dataToString(arguments));
}
