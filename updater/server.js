http 	= require('http'),
fs		= require('fs'),
update  = require('./update'),
ws		= __dirname,
webroot = path.normalize(path.join(ws, "/.."));

function trim(str){
	return str.replace(/^\s+/, "").replace(/\s+$/, "");
}
version  = trim(process.argv[2]),
cVersion = trim(process.argv[3]),
updateStarted = false;
function cb(){
	if(version != cVersion){
		//start server
		//读取用户配置信息
		var config = fs.readFileSync(path.join(webroot,'/config.json'), "utf8");
		var workspace = JSON.parse(config).workspace;
		config = fs.readFileSync(path.join(workspace, '/config.json'), 'utf8');
		config = JSON.parse(config);

		var server = http.createServer();
		server.on("request", function(req, res){
			res.setHeader("Content-Type", "application/json");
			if(req.url.match(/^\/getupdatelog/)){
				var log = fs.readFileSync(path.join(ws, "/temp/updatelog"), 'utf8');
				res.end(log);
			}else if(req.url.match(/^\/startupdate/)){
				if(!updateStarted){
					update(version, cVersion);
					updateStarted = true;
				}
				var re = JSON.stringify({
					"errCode" : 0
				});
				res.end(re);
			}else{
				res.end("");
			}
		});
		server.listen(config.port);
	}else{
		process.send('stop');
	}
}
setTimeout(cb, 1000);