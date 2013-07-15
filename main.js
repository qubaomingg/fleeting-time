cp = require('child_process');
configCheck = require('./lib/configCheck');
express = require('express');
_ = require('underscore.string');

var mainProcess, configProcess, nodeVersionProcess;

function start(){
	if(configCheck.isConfigOk()){
		mainProcess = cp.fork(__dirname + '/app.js');
		mainProcess.on('message', mainMsgHandler);
	}else{
		startConfig();
	}
}

function startConfig(){
	configProcess = cp.fork(__dirname + '/configServer.js');
	configProcess.on('message', function(msg){
		if(msg == 'configOk'){
			configProcess.kill();
			start();
		}
	})
}

function nodeVersion(currentVersion, needVersion){
    nodeVersionProcess = cp.fork(__dirname + '/nodeversion.js', [currentVersion, needVersion]);

    nodeVersionProcess.on('message', function(msg){
    	if(msg == 'stop'){
    		nodeVersionProcess.kill();
    		nodeVersionProcess = null;
    	}
    });
}

function stop(){
	if(!!mainProcess){
		mainProcess.kill();
	}

	mainProcess = null;
}

function restart(){
	stop();
	start();
}

function mainMsgHandler(msg){
	var type = msg;
	if(typeof msg == "object"){
		type = msg.type;
	}
	if(type == 'restart'){
		restart()
	}else if(type == 'stop'){
		stop();
		process.send("stop");
	}else if(type == 'update'){
		process.send({
			"type" : "update",
			"version" : msg.version,
			"cVersion": msg.cVersion
		});
	}
}

function startConfigApp(){

}
var NODEVERSION = _.trim(process.versions.node),
	version_split = NODEVERSION.split("."), valid = true;
if(version_split[0] == 0 && version_split[1] < 8){
	valid = false;
}
if(NODEVERSION && !valid){
	nodeVersion(NODEVERSION, "v0.8+");
}else{
    if(require.main === module){
	    restart();
    }
}
