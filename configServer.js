var express = require('express');
var path = require('path');
var http = require('http');
var app = express.createServer();
var webroot = path.resolve(__dirname);
var fs = require('fs');
var toolFile = path.join(__dirname, "config.json");
var configCheck = require('./lib/configCheck');

var defaultConfig = fs.readFileSync(path.join(webroot, "source/config.all"));

defaultConfig = JSON.parse(defaultConfig);

function extend(t, s){
	for(var k in s){
		if(s[k]||s[k] === 0){
			t[k] = s[k];
		}
	}
	return t;
}

// config
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// middleware
app.configure(function() {
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('keyboard cat'));
	app.use(app.router);
	app.use(express.static(__dirname + '/views/assets/'));
	app.use(express.errorHandler({
		dumpExceptions : true,
		showStack : true
	}));
});

app.get('/', function(req, res) {
	res.render('base_config_step1');
});

app.get('/login', function(req, res){
	res.redirect('/');
})

app.post('/', function(req, res) {
	var step = req.body.step, setting = req.body.setting;

	if(step == 1){
		if(!setting.workspace){
			res.render('base_config_step1', {
				workspaceErr:'请填写工作目录',
                workspace:''
			});
			return;
		}

		if(!fs.existsSync(setting.workspace)){
			res.render('base_config_step1', {
				workspaceErr:'工作目录不存在',
				workspace:setting.workspace
			});
			return;
		}

		var stats = fs.statSync(setting.workspace);

		if(!stats.isDirectory()){
			res.render('base_config_step1', {
				workspaceErr:'工作目录不是一个目录',
				workspace:setting.workspace
			});
			return;
		}
		//判断目录是否具有读写权限
		try{
			//尝试读取，写入文件和删除文件
			var randomFileName = new Date().getTime().toString(),
				testFilePath = path.join(setting.workspace, randomFileName+randomFileName);
			fs.writeFileSync(testFilePath, '^', 'utf8');
			fs.readFileSync(testFilePath, 'utf8');
			fs.unlinkSync(testFilePath);
		}catch(e){
			res.render('base_config_step1',{
				workspaceErr: "设置的目录权限不够",
				workspace:setting.workspace
			});
			return;
		}

		fs.writeFileSync(toolFile, JSON.stringify({workspace:setting.workspace}), "utf8");

		res.render('base_config_step2', {
			"ip" : defaultConfig.ip.default,
			"port": defaultConfig.port.default,
			"hostname": defaultConfig.hostname.default
		});
	}

	if(step == 2){
		var config = {}, workspace = fs.readFileSync(toolFile, 'utf8');

		workspace = JSON.parse(workspace);

		config.workspace = workspace.workspace;

		extend(config, setting);

		config.themeNamePre = defaultConfig.themeNamePre.default;
		config.dirNamePre = defaultConfig.dirNamePre.default;

		var isConfigOk = configCheck.isConfigOk(config);

		if(isConfigOk){
			delete config.workspace;

			if(config.port == defaultConfig.port.default && config.ip == defaultConfig.ip.default){
				fs.writeFileSync(path.join(workspace.workspace, 'config.json'), JSON.stringify(config), "utf8");

				res.render('base_config_ok', {
					host: 'http://' + config.ip + ':' + config.port
				});

				setTimeout(function(){
					process.send('configOk');
				}, 500);

				return;
			}

			var testServer = http.createServer(function(req, res){
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.end('venus');
			});
			testServer.listen(config.port, config.ip);

			testServer.once('error', function(err){
				res.render('base_config_step2', {
					"ip" : config.ip||"",
					"port": config.port||"",
					"hostname": config.hostname||"",
					"step2Err": "监听IP或监听端口不可用"
				});
			})

			testServer.once('listening', function(){
				fs.writeFileSync(path.join(workspace.workspace, 'config.json'), JSON.stringify(config), "utf8");

				res.render('base_config_ok', {
					host: 'http://' + config.ip + ':' + config.port
				});

				setTimeout(function(){
					process.send('configOk');
				}, 500);
			})

		}else{
			res.render('base_config_step2', {
				"ip" : config.ip||"",
				"port": config.port||"",
				"hostname": config.hostname||"",
				"step2Err": "监听IP或监听端口不能为空"
			});
		}

	}
});

// start
if (!module.parent) {
	app.listen(defaultConfig.port.default);
}

