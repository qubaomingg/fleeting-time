cp 			= require('child_process'),
path 		= require('path'),
fs			= require('fs'),
env			= require('../lib/setting'),
webroot		= env.get('webroot');
ticket		= require('../lib/ticket');
lockFile 	= path.join(webroot, "/source/publishlock");


var publishProccess, themeId, callback;

function startPublishProcess(){
	if(!themeId) return;
	console.log("开启上传子进程");
	unlockPublishProcess();
	//传入ticket
	var ticketData = JSON.stringify(ticket.get());
	publishProccess = cp.fork(__dirname + "/publisher.js", [themeId, ticketData]);

	publishProccess.on("message", function(msg){
		var type = msg.type;
		if(type == 'stop'){
			stopPublishProcess();
		}
		if(type == 'restart'){
			restartPublishProcess();
		}
		if(type == 'fail'){
			callback(msg.data);
			stopPublishProcess();
		}
		if(type == "success"){
			callback(msg.data);
		}
	});
	lockPublishProcess(publishProccess.pid);
}

function stopPublishProcess(){
	console.log("关闭上传子进程");
	unlockPublishProcess();
}

function restartPublishProcess(){
	console.log("重启上传子进程");
	stopPublishProcess();
	startPublishProcess();
}

function lockPublishProcess(pid){
	console.log("进程上锁", pid);
	if(fs.existsSync(lockFile)){
		var cpid = fs.readFileSync(lockFile, "utf8");
		try{
			process.kill(cpid);
		}catch(e){}
	}
	fs.writeFileSync(lockFile, pid, "utf8");
}

function unlockPublishProcess(){
	console.log("进程解锁");
	if(fs.existsSync(lockFile)){
		var cpid = fs.readFileSync(lockFile, "utf8");
		try{
			process.kill(cpid);
		}catch(e){}
		fs.unlink(lockFile);
	}
}

module.exports = function(lo, cb){
	themeId = lo;
	callback = cb;
	restartPublishProcess();
}