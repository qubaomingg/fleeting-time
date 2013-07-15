fs 		= require('fs'),
path 	= require('path'),
http	= require('http'),
dir 	= require('./dir-utils'),
util 	= require('util'),
domain  = require('domain').create(),
webroot = __dirname,
root	= path.normalize(webroot + '/..');


domain.on("error", function(er){
	printLog({
		"fatal" : "venus自动更新失败，请手动更新。"
	});
});

tempDir = path.join(webroot,'temp');

if(!fs.existsSync(tempDir)){
	fs.mkdirSync(tempDir);
}

logFile = path.join(tempDir, "updatelog");

var logCache = [];

function printLog(obj){
	console.log(obj);
	logCache.push(obj);

	fs.writeFileSync(logFile, JSON.stringify(logCache), 'utf8');
}

function getFiles(version, cVersion){
	var me = this, file_name = "diandian-venus-" + version + ".zip",
		url = "http://x.libdd.com/" + file_name + "?v=1", unzip = require('adm-zip'),
		target = path.join(tempDir, file_name);
	printLog({
		"start" : "开始启动自动更新服务"
	});
	dir.rmdir(tempDir, function(){
		dir.mkdir(tempDir, '', function(){
			printLog({
				"download" : "开始下载venus, 版本: " + version
			});
			http.get(url, function(res){
				var data = [], bufLen = 0;
				res.on("data", function(body){
					var total = res.headers['content-length'];
					bufLen += body.length;

					printLog({
						"downloading" : Math.round(bufLen/total*100) + "%"
					});
					data.push(body);
				});
				
				res.on("end", function(){
					if(res.statusCode == 200){
                    	printLog({
                    		"downloaded" : "下载完成。"
                    	});
                    	var buffer = new Buffer(bufLen), pos = 0;
                    	for(var i = 0; i < data.length;i++){
                    		data[i].copy(buffer, pos);
                    		pos += data[i].length;
                    	}
						backupFile(cVersion, function(){
							printLog({
                    			"extract" : "开始解压venus"
                        	});
							var updateFile = new unzip(buffer),
								tempUrl = path.join(tempDir, "/diandian-venus");
							updateFile.extractAllTo(tempUrl);
							printLog({
                    			"extracted" : "解压venus完成"
                        	});
                        	dir.rmdir(path.join(tempUrl, "/updater"));
                        	fs.unlinkSync(path.join(tempUrl, "/start.sh"));
                        	fs.unlinkSync(path.join(tempUrl, "/start.bat"));

                        	printLog({
                    			"update" : "开始升级venus"
                        	});
                        	var whiteLists = [
                        			root + "/updater",
                        			root + "/start.sh",
                        			root + "/start.bat",
                        			root + "/config.json",
                        			root + "/log"
                        		];
                        	dir.rmdir(root, function(){
                        		copy(tempUrl, root, function(err){
	                        		if(err){
	                        			printLog({
	                        				"fatal" : "venus升级失败，请手动升级。"
	                        			});
	                        		}else{
	                        			printLog({
	                        				"updated" : "venus升级完成，最新版本为: " + version
	                        			});
	                        		}
	                        	}, true);
                        	}, whiteLists, true);
                        	
                        	printLog({
                        		"updated" : "正在清理临时数据..."
                        	});
                			printLog({
                				"restart" : "请等待venus重启..."
                			});
                			setTimeout(function(){
								dir.rmdir(tempDir);
                				process.send("updateok");
                        	}, 1000);
						});
					}else{
						printLog({
							"fatal" : "venus下载失败，请选择手动下载更新"
						});
						process.send("stop");
					}
				});
			});
		});
	});
}

/*建立source目录和target目录的映射表*/
function listFiles(source, target, results, update) {
	var stat = fs.statSync(source);
	if (stat.isDirectory()) {
		if (!fs.existsSync(target)) {
			fs.mkdirSync(target);
		}

		var files = fs.readdirSync(source);
		files.forEach(function(file) {
			listFiles(path.join(source, file), path.join(target, file), results, update);
		});
	} else {
		if(update || source.indexOf(__dirname) != 0){
			results.push({source : source, target : target});
		}
	}
};
/*将source目录数据写入target*/
function copy(source, target, cb, update) {
	var tasks = [];
	listFiles(source, target, tasks, update);
	var once = (function() {
		var task = tasks.shift();
		if (!task) {
			return cb();
		}
		
		// console.log('source = ' + task.source);
		// console.log('target = ' + task.target);
		var sourceReadableStream = fs.createReadStream(task.source);
		var targetWritableStream = fs.createWriteStream(task.target);
		util.pump(sourceReadableStream, targetWritableStream, function(err) {
			if (err) {
				return cb(err);
			}
			once();
		});
	});
	
	once();
};

function backupFile(version, cb){
	var target = path.normalize(root + "/../venus-" + version);
	printLog({
		"bakup" : "开始备份venus到目录: " + target
	});
	dir.rmdir(target, function(){
		dir.mkdir(target, '', function(){
			copy(root, target, function(err){
				if(!err){
					dir.rmdir(path.join(target, "/updater/"));
					printLog({
						"bakuped" : "备份venus成功。"
					});
					cb();
				}else{
					printLog({
						"fatal" : "备份venus失败，请手动备份并更新。"
					});
					process.send("stop");
				}
			});
		});
	});
}

module.exports = domain.bind(getFiles);