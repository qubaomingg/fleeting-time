var fs 	 = require('fs'), 	path = require('path'), 
	util = require('util'),
	us   = require('underscore')._,
	setting = env = require('../lib/setting'),
	logger = require('../lib/log'),
	removeComments = require('remove-comments');

var TEMPLATE 	= path.join(env.get('webroot'),"source/template"),
	FILE_CONFIG = "config.json",
	INDEX		= "index.html",
	COVER		= "img/thumbnail",
	CURWS 	    = env.get('workspace');

var Theme = function (location) {
	this.id     = location;
	if(!this.exists()){
		logger.error("Theme not exists. @", location);
		return;
	}
	this.folder = path.basename(location);
	this._getCover();
	this.load();
};

Theme.template = TEMPLATE;

Theme.init = function(id){
	return (new Theme(path.join(env.get('workspace'), id)));
}

Theme.prototype = {
	config  : FILE_CONFIG,
	index   : INDEX,
	cover 	: "",
	info: {},
	exists : function() {
		return fs.existsSync(this.id);
	},
	_extend: function(t, s){
		for(var k in t){
			if(s[k]){
				t[k] = s[k];
			}
		}
	},
	//获取主题的封面地址
	_getCover: function(){
		//遍历img目录，查找名字为COVER的图片文件
		var photoExt = ['.jpg', '.JPG', '.png', '.PNG', '.gif', '.GIF', '.bmp', '.BMP', '.jpeg', '.JPEG', '.tiff', '.TIFF', '.tga', '.TGA'],
			me = this;
		for(var i=0,l=photoExt.length;i<l;i++){
			if(fs.existsSync(path.join(me.id, COVER+photoExt[i]))){
				me.cover = COVER + photoExt[i];
				break;
			}
		}
	},

	//获取目录下文件的最新修改时间
	_getModifyTime : function(){
		var date = 0;
		function T(lo){
			var stat = fs.statSync(lo);
			if (stat.isDirectory()) {
				var files = fs.readdirSync(lo);
				files.forEach(function(file) {
					T(path.join(lo, file));
				});
			} else {
				if(stat.mtime.getTime() > date){
					date = stat.mtime.getTime();
				}
			}
		}
		T(this.id);
		return date;
	},

	/*获取文件对象的信息*/
	load : function() {
		var files, data, meta, lastModify;
		this.info = this.getInfo();

		function formatDate(time){
			var date = new Date(time);
			function T(s){
				return s?(parseInt(s, 10) > 9?s:("0"+s)):0;
			}
			return T(date.getFullYear()) + "-" 
				   + T(date.getMonth() + 1) + "-"
				   + T(date.getDate()) + " "
				   + T(date.getHours()) + ":"
				   + T(date.getMinutes()) + ":"
				   + T(date.getSeconds())
		}

		lastModify = this._getModifyTime(this.id);
		this.modifiedTime = formatDate(lastModify);
		this.thumbnail = this.cover;
	},

	getPath: function(){
		return this.id;
	},

	getId: function(){
		return this.folder;
	},

	_en2br: function(str){
		return str.replace(/\n/g, "<br/>");
	},

	getInfo : function() {
		var config = path.join(this.id, FILE_CONFIG);
		//如果没有config，则跳过该目录
		if(fs.existsSync(config)){
			var	data   = fs.readFileSync(config, "utf8"),
				re 	   = JSON.parse(data);

			if(re.description){
				re.description = this._en2br(re.description);
			}
			//如果folder被修改，则自动保存
			var folder = path.basename(this.id);
			if(folder != re.folder){
				re.folder = folder;
				fs.writeFileSync(config, JSON.stringify(re), "utf8");
			}

			return re;
		}else{
			return {};
		}
	},
	setInfo : function(obj){
		us.extend(this.info, obj);

		fs.writeFileSync(
			path.join(this.id, FILE_CONFIG),
			JSON.stringify(this.info), "utf8"
		);
	},

	clone : function(template, cb) {
		copy(template.id, this.id, cb);
	},

	getHTML: function(){
		return fs.readFileSync(path.join(this.id, INDEX) , "utf8");
	},
	hasFile: function(lo){
		var _path = path.join(this.id, lo);
		return fs.existsSync(_path);
	},
	getFile: function(lo, noComments){
		var _path = path.join(this.id, lo),
            extname = path.extname(_path).toLowerCase(),
            photos = ['.jpg', '.png', '.gif', '.bmp', '.jpeg', '.tiff', '.tga'],
            re = "";
		
		if(fs.existsSync(_path)){
        	if(photos.indexOf(extname) > -1){
                re = fs.readFileSync(_path);
            }else{
			    re = fs.readFileSync(_path, "utf8");
			    if(noComments){
				    if(extname == ".js"){
				    	re = removeComments.js(re);
				    }else if(extname == ".css" || extname == ".less"){
				    	re = removeComments.css(re);
				    }else if(extname == ".html" || extname == ".htm"){
				    	re = removeComments.html(re);
				    }
			    }
            }
            return re;
		}else{
			return -1;
		}
	},
	_getFileList: function(dir){
		var stat = fs.statSync(dir), re = [], me = this, js = [], imgs = [], css = [], html = []
			photos = ['\\.jpg', '\\.png', '\\.gif', '\\.bmp', '\\.jpeg', '\\.tiff', '\\.tga'];
		if(stat.isDirectory()){
			function T(file){
				var _stat = fs.statSync(file);
				if(_stat.isDirectory()){
					var files = fs.readdirSync(file);
					files.forEach(function(_file){
						T(path.join(file,_file));
					});
				}else{
					if(file.match(new RegExp('(' + photos.join('|') + ")\s*$",'i'))){
						imgs.push(file);
					}else if(file.match(/\.js\s*$/)){
						js.push(file);
					}else if(file.match(/\.css\s*$/)){
						css.push(file);
					}else if(file.match(/\.html?\s*$/)){
						html.push(file);
					}else{
						re.push(file);
					}
				}
			}
			T(dir);
		}
		return {
			'css': css,
			'js' : js,
			'imgs': imgs,
			'html': html,
			'other': re
		};
	},
	getFileList: function(){
		return this._getFileList(this.id);
	},
	getRelativeUrl: function(url){
		if(url.indexOf(this.id) != -1){
			url = url.substring(this.id.length);
		}
		return url;
	}
}
/*建立source目录和target目录的映射表*/
function listFiles(source, target, results) {
	var stat = fs.statSync(source);
	if (stat.isDirectory()) {
		if (!fs.existsSync(target)) {
			fs.mkdirSync(target);
		}

		var files = fs.readdirSync(source);
		files.forEach(function(file) {
			listFiles(path.join(source, file), path.join(target, file), results);
		});
	} else {
		results.push({source : source, target : target});
	}
};
/*将source目录数据写入target*/
function copy(source, target, cb) {
	var tasks = [];
	listFiles(source, target, tasks);
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
//替换文件
/*模板替换字典*/
var translators = {
	"jsrequire" : {
		"jQuery1.7.x" : "<script type='text/javascript' src='http://t.libdd.com/js/libs/jquery/jquery-1.7-latest.js'></script>",
		"jQuery1.6.x" : "<script type='text/javascript' src='http://t.libdd.com/js/libs/jquery/jquery-1.6-latest.js'></script>",
		"jQuery1.5.x" : "<script type='text/javascript' src='http://t.libdd.com/js/libs/jquery/jquery-1.5-latest.js'></script>",
		"jQuery1.7.2" : "<script type='text/javascript' src='http://t.libdd.com/js/libs/jquery/1.7.2/jquery.js'></script>",
		"jQuery1.7.1" : "<script type='text/javascript' src='http://t.libdd.com/js/libs/jquery/1.7.1/jquery.js'></script>",
		"jQuery1.7"   : "<script type='text/javascript' src='http://t.libdd.com/js/libs/jquery/1.7/jquery.js'></script>",
		"jQuery1.6.4" : "<script type='text/javascript' src='http://t.libdd.com/js/libs/jquery/1.6.4/jquery.js'></script>",
		"jQuery1.5.2" : "<script type='text/javascript' src='http://t.libdd.com/js/libs/jquery/1.5.2/jquery.js'></script>",
		"jQuery1.5.1" : "<script type='text/javascript' src='http://t.libdd.com/js/libs/jquery/1.5.1/jquery.js'></script>",
		"Mootools1.4.x": "<script type='text/javascript' src='http://t.libdd.com/js/libs/mootools/mootools-1.4-latest.js'></script>",
		"Mootools1.4.3": "<script type='text/javascript' src='http://t.libdd.com/js/libs/mootools/1.4.3/mootools.js'></script>",
		"Mootools1.4.1": "<script type='text/javascript' src='http://t.libdd.com/js/libs/mootools/1.4.1/mootools.js'></script>",
		"Underscore.js": "<script type='text/javascript' src='http://t.libdd.com/js/libs/underscore/1.3.1/underscore.js'></script>",
		"Tangram": "<script type='text/javascript' src='http://t.libdd.com/js/libs/tangram/1.5.0/tangram.js'></script>",
		"Tangram-core":"<script type='text/javascript' src='http://t.libdd.com/js/libs/tangram/1.5.0/tangram-core.js'></script>"
	},

	"cssrequire": {
		"Blueprint.screen" : "<link rel='stylesheet' href='http://t.libdd.com/css/libs/blueprint/screen.css'/>",
		"Blueprint.print" : "<link rel='stylesheet' href='http://t.libdd.com/css/libs/blueprint/print.css'/>",
		"Blueprint.ie" : "<link rel='stylesheet' href='http://t.libdd.com/css/libs/blueprint/ie.css'/>",
		"960GridSystem.reset": "<link rel='stylesheet' href='http://t.libdd.com/css/libs/960gs/reset.css'/>",
		"960GridSystem.text": "<link rel='stylesheet' href='http://t.libdd.com/css/libs/960gs/text.css'/>",
		"960GridSystem.960": "<link rel='stylesheet' href='http://t.libdd.com/css/libs/960gs/960.css'/>",
		"960GridSystem.960_24_col": "<link rel='stylesheet' href='http://t.libdd.com/css/libs/960gs/960_24_col.css'/>"
	}
};
function stringParser(str, obj){
	for(var k in obj){
		if(! obj[k] || !obj[k].split){
            obj[k] = "";
        }
		var html = [], re = obj[k].split("+");
		us.each(re, function(r){
			html.push(translators[k][r]);
		});
		html = html.join("\n\t");
		str = str.replace(new RegExp("\\{"+k+"\\}", "g"), html)
	}
	return str;
}
function getTimeFormatString(){
	function T(d){
		return d > 10 ? d : ("0"+d);
	}
	var date = new Date(), str = "";
	str += date.getFullYear();
	str += T(date.getMonth()+1);
	str += T(date.getDate());
	str += T(date.getHours());
	str += T(date.getMinutes());
	str += T(date.getSeconds());
	str += T(date.getMilliseconds());

	return str;

}

/*新建模板, 
 *errCode: 0 成功， 
 		   1 模板名称不存在， 1.1 模板名称被占用， 1.2 模板名称超长 
 		   1 目录名不存在， 1.1  目录名被占用， 1.2 目录名超长， 1.3 目录名不合法
 */
Theme.checkThemeName = function(name){
	var errCode = 0, errMsg = "";
	if(!name){
		errCode = 1;
		errMsg  = "模板名称不能为空";
	}else if(name.length > 60){
		errCode = 1.2;
		errMsg  = "模板名称不能多于60个字符";
	}else{
		this.findAll(CURWS, function(code, data){
			errCode = code;
			if(errCode == 0){
				us.each(data, function(v){
					if(v.name == name){
						errCode = 1.1;
						errMsg = "模板名称已被占用";
					}
				});
			}else{
				errMsg  = data;
			}
		}, true);
	}
	return {
		errCode: errCode,
		errMsg : errMsg
	};
}
Theme.checkDirName = function(name){
	var errCode = 0, errMsg = "";
	if(!name){
		errCode = 1;
		errMsg  = "目录名不能为空";
	}else if(name.length > 30){
		errCode = 1.2;
		errMsg = "目录名不能多于30个字符";
	}else if(name.match(/[^\w]/)){
		errCode = 1.3;
		errMsg = "目录名只能包含字母，数字，下划线";
	}else{
		if(fs.existsSync(path.join(CURWS, name))){
			errCode = 1.1;
			errMsg = "该目录已存在";
		}
	}
	return {
		errCode: errCode,
		errMsg : errMsg
	};
}
/*新建模板， errCode:
	0 成功 1 新建模板失败

	location (string)
	meta 	 (object)
	template (Theme)
	cb	     (function)
*/
Theme.create = function(location, meta, template, cb) {
	var status = this.checkThemeName(meta.name);
	if(status.errCode != 0){
		return cb(status);
	}

	status = this.checkDirName(meta.folder);

	if(status.errCode != 0){
		return cb(status);
	}

	var theme = new Theme(location), me = this;

	theme.clone(template, function(err) {
		
		if (err) {
			status.errCode = 1;
			status.errMsg = '模板创建失败';
			return cb(status);
		}
		
		Theme.findOne(location, function(err, theme) {
			theme.setInfo(meta);

			/*变量替换*/
			var filePath = path.join(location, "index.html"),
				data = fs.readFileSync(filePath, "utf8");

			data = stringParser(data, {
				jsrequire : meta.jsrequire,
				cssrequire: meta.cssrequire
			});

			fs.writeFileSync(filePath, data);

			cb(status);
		});
	});
};
/*获取单个模板的对象
  errCode: 0 成功 1 未找到
*/
Theme.findOne = function(location, cb) {
	var theme;
	fs.exists(location, function(exists) {

		if (!exists) {
			return cb(1);
		}

		theme = new Theme(location);
		cb(theme?0:1, theme);
	});
};
/*获取目录下所有的模板列表对象,
  errCode: 0 成功， 1 目录不存在 
*/
Theme.findAll = function(location, cb, isSync) {
	function T(err, files) {
		if (err) {
			cb(1);
			return;
		}

		var themes = [];
		try{
			files.forEach(function(file) {
				file = path.join(location, file);
				var stat = fs.lstatSync(file);
				if (!stat.isDirectory()) {
					return;
				}
				var theme = new Theme(file);
				theme.previewBlogId = setting.get("defaultPreviewBlogId");
				//临时屏蔽template
				if(theme && theme.info.name && theme.info.name != "template"){
					theme.id = path.basename(theme.id);
					themes.push(theme);
				}
			});
		}catch(e){}
		themes = themes.sort(function(a,b){
			return new Date(b.modifiedTime).getTime() - 
				   new Date(a.modifiedTime).getTime()
		});
		cb(0, themes);
	}
	if(isSync){
		var re = fs.readdirSync(location);
		T(re?0:1, re);
	}else{
		fs.readdir(location, T);
	}
};
/*获取单个模板的对象
  errCode: 0 成功 1 未找到
*/
Theme.findOne = function(location, cb) {
    var theme;
    fs.exists(location, function(exists) {

        if (!exists) {
            return cb(1);
        }

        theme = new Theme(location);
        cb(theme?0:1, theme);
    });
};
/*保存为常用配置*/
Theme.saveAsDefault = function(meta, cb){
	var tpl = new Theme(TEMPLATE),
		status = {errCode: 0, errMsg: ""}, _meta = {};

	_meta.jsrequire = meta.jsrequire || "";
	_meta.cssrequire = meta.cssrequire || "";
	
	if(tpl){
		tpl.setInfo(_meta);
	}else{
		status.errCode = 1;
		status.errMsg = "保存常用配置出错";
	}
	cb(status);
}
Theme.quickCreate = function(cb){
	var tpl = new Theme(TEMPLATE),
		meta = tpl.info, settingParam = setting.getAll();
	meta.name = settingParam.themeNamePre + "_" + getTimeFormatString();
	meta.folder = settingParam.dirNamePre + "_" + getTimeFormatString();

	this.create(path.join(CURWS, meta.folder), 
				meta, tpl, cb);
}

Theme.changeName = function(name, to){
    var theme = new Theme(path.join(CURWS, name));

    if(!theme){
        status.errCode = 1;
        status.errMsg = "要修改的目录不存在";
    }
    var status = this.checkThemeName(to);
    if(status.errCode != 0){
        return status;
    }

    theme.setInfo({name: to});

    return status;
}
Theme.changeDescription = function(name, to){
    var theme = new Theme(path.join(CURWS, name)),
        status = {errCode: 0, errMsg: ''};

    if(!theme){
        status.errCode = 1;
        status.errMsg = "要修改的目录不存在";
    }

    theme.setInfo({description: to});

    return status;
}

module.exports = Theme;
