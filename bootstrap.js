cp = require('child_process');

var mainProcess, updateProcess;
//启动主进程
function startMainProcess(){
	console.log("启动主进程");
	mainProcess = cp.fork(__dirname + '/main.js');

	mainProcess.on("message", function(msg){
		var type = msg;
		if(typeof msg == "object"){
			type = msg.type;
		}
		switch(type){
			case "stop" :
				stopMainProcess();
				break;
			case "restart" :
				restartMainProcess();
				break;
			case "update" :
				restartUpdateProcess(msg.version, msg.cVersion);
				break;
		}
	});
}

function stopMainProcess(){
	console.log("退出主进程");
	if(mainProcess){
		mainProcess.kill();
		mainProcess = null;
	}
}

function restartMainProcess(){
	stopMainProcess();
	startMainProcess();
}

//启动更新进程

function startUpdateProcess(version, cVersion){
	console.log("启动更新进程");
	updateProcess = cp.fork(__dirname + '/updater/server.js', [version, cVersion]);

	updateProcess.on("message", function(msg){
		if(msg == 'stop'){
			stopUpdateProcess();
		}
		if(msg == 'updateok'){
			console.log("更新完成，启动主进程");
			setTimeout(function(){
				stopUpdateProcess();
				setTimeout(restartMainProcess, 1000);
			}, 1000);
		}
	});
}

function stopUpdateProcess(){
	if(updateProcess){
		console.log("退出更新进程");
		updateProcess.kill();
		updateProcess = null;
	}
}

function restartUpdateProcess(version, cVersion){
	stopUpdateProcess();

	startUpdateProcess(version, cVersion);
}

if(require.main === module){
    restartMainProcess();
}
