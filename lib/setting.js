var fs 	= require('fs'),
	path = require('path'),
	webroot = path.resolve(__dirname + '/../'),
	ustring = require('underscore.string'),
	toolFile = path.join(webroot, "config.json"),
	file = "",
	defaultConfig = fs.readFileSync(path.join(webroot, "source/config.all"));

defaultConfig = JSON.parse(defaultConfig);

var DEFAULT_TEMP_PRE = defaultConfig.themeNamePre.default,
	DEFAULT_DIR_PRE = defaultConfig.dirNamePre.default;


var settings = {
	init: function(){
		file = path.join(this.getWorkspace(), "config.json");
	},
	getWebroot: function(){
		return webroot;
	},
	getWorkspace: function(){
		return this.getAll().workspace;
	},
	getAll: function(){
		var def = {
			themeNamePre: DEFAULT_TEMP_PRE,
			dirNamePre  : DEFAULT_DIR_PRE,
			ip			: defaultConfig.ip.default,
			port		: defaultConfig.port.default,
			hostname	: defaultConfig.hostname.default,
			workspace  	: defaultConfig.workspace.default,
			webroot 	: ""
		};
		if(fs.existsSync(file)){
			var userSetting = fs.readFileSync(file, 'utf8');
			try{
				this._ext(def, JSON.parse(userSetting));
			}catch(e){}
		}
		if(fs.existsSync(toolFile)){
			var sysSetting = fs.readFileSync(toolFile, "utf8");
			try{
				this._ext(def, JSON.parse(sysSetting));
			}catch(e){}
		}
		return def;
	},
	_ext: function(t, s){
		for(var k in s){
			if(typeof s[k]||s[k] === 0||k=="hostname"){
				t[k] = s[k];
			}
		}
		return t;
	},
	set: function(obj){
		var data = this.getAll(),
			status = {errCode: 0};
		this._ext(data, obj);
		if(data['workspace']){
			var wp = ustring.trim(data.workspace),
				configPath = toolFile;
			if(fs.existsSync(configPath)){
				var config = fs.readFileSync(configPath, "utf8");
					config = JSON.parse(config);
			}else{
				config = {};
			}
			wp = path.normalize(wp);
			//检测设置的目录是否存在
			var exist = fs.existsSync(wp);
			if(exist){
				//判断是否为目录
				var stats = fs.statSync(wp);
				if(!stats.isDirectory()){
					status.errCode = 3;
					status.errMsg = "设置的工作路径不是目录";
					return status;//工作路径不是目录
				}
				//判断目录是否具有读写权限
				try{
					//尝试读取，写入文件和删除文件
					var randomFileName = new Date().getTime().toString(),
						testFilePath = path.join(wp, randomFileName+randomFileName);
					fs.writeFileSync(testFilePath, '^', 'utf8');
					fs.readFileSync(testFilePath, 'utf8');
					fs.unlinkSync(testFilePath);
				}catch(e){
					status.errCode = 4;
					status.errMsg = "设置的目录权限不够";
					return status;//目录没有权限
				}
				//判断目录是否有改变	
				if(config.workspace != wp){
					if(path.normalize(config.workspace) != wp){
						status.forceRestart = true;
					}
                    //如果工作目录中不存在config文件，复制现有的workspace配置。
                    var workspaceConfigPath = path.join(wp, 'config.json'),
                        configData = fs.readFileSync(path.join(config.workspace, 'config.json'), "utf8");

                    if(!fs.existsSync(workspaceConfigPath)){
                        fs.writeFileSync(workspaceConfigPath, configData, "utf8");
                    }

					config.workspace = data.workspace;
                    fs.writeFileSync(configPath, JSON.stringify(config), "utf8");

				}
			}else{
				status.errCode = 2;
				status.errMsg = "设置的目录不存在";
				return status;//用户设置的工作目录不存在
			}
			delete data.workspace;	
		}
		try{
			fs.writeFileSync(file, JSON.stringify(data), 'utf8');
			return status;
		}catch(e){
			status.errCode = 1;
			status.errMsg = "保存设置失败";
			return status;
		}
	},
	get: function(key){
		var config = this.getAll();
		config.workspace = config.workspace.replace(/\{__dirname\}/, webroot);
		config.workspace = path.normalize(config.workspace);
		config.webroot = webroot;

		config.hostname = config.hostname || config.ip + ':' + config.port;
		config.hosturl = 'http://' + config.hostname;
		return config[key]||"";
	}
};
settings.init();
module.exports = settings;
