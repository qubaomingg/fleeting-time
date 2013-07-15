var us   = require('underscore')._,
	workspace = require('../lib/setting').get('workspace'),
	theme = require('../lib/theme'),
	fs = require('fs'), path = require("path"),
	htmlparser = require('htmlparser'),
	domain  = require('domain').create(),
	staticParser = require('../lib/staticParser'),
	imageinfo = require('imageinfo');

/*
1. 检查css中是否有非法expression；
2. 有无调用站外资源；
3. html标签属性的是否经过了nohtml过滤器；
4. js中根据需要使用js或js_nohtml过滤器；
5. js和css加载数量不能超过3个（不包含第三方插件）；
6. 静态文件大小不能超过1M；
*/

var checker = function(lo){
	this.themeObj = new theme(lo);
	this.cover = path.basename(this.themeObj.cover);
}
checker.prototype = {
	_check: function(){
		if(!this.themeObj) return {};
		var files = this.themeObj.getFileList(), logs = {}, me = this;
		us.each(files.html, function(item, i){
			var name = path.basename(item), arr = [],
				relativeUrl = me.themeObj.getRelativeUrl(item),
				data = me.themeObj.getFile(relativeUrl, true);
			arr = arr.concat(me.filesize(item)||[]);
			arr = arr.concat(me.htmlAttr(data)||[]);
			logs[name] = arr;
		});
		us.each(files.css, function(item, i){
			var name = path.basename(item), arr = [],
				relativeUrl = me.themeObj.getRelativeUrl(item),
				data = me.themeObj.getFile(relativeUrl, true);
			arr = arr.concat(me.filesize(item)||[]);
			arr = arr.concat(me.hasInvalidSource(relativeUrl)||[]);
			arr = arr.concat(me.inCss(data)||[]);
			logs[name] = arr;
		});
		us.each(files.js, function(item, i){
			var name = path.basename(item), arr = [],
				relativeUrl = me.themeObj.getRelativeUrl(item),
				data = me.themeObj.getFile(relativeUrl, true);
			arr = arr.concat(me.filesize(item)||[]);
			arr = arr.concat(me.hasInvalidSource(relativeUrl)||[]);
			logs[name] = arr;
		});
		us.each(files.imgs, function(item, i){
			var name = path.basename(item), arr = [];
			arr = arr.concat(me.filesize(item)||[]);
			logs[name] = arr;
		});
		
		return logs;
	},

	_checkThumbnail: function(cb){
		//获取封面信息
		var thumbnailPath = path.join(this.themeObj.id, this.themeObj.cover), arr = [];
		if(fs.existsSync(thumbnailPath)){
			var buffer = fs.readFileSync(thumbnailPath);
			var size = imageinfo(buffer);
			if(size.width != 750 || size.height != 500){
	 			arr = arr.concat([
	 				{"fatal":"模板封面大小("+size.width+"*"+size.height+")不正确，应该是750*500"}
	 			]);
	 			cb(arr);
	 		}else{
	 			cb();
	 		}
		}else{
			arr = arr.concat([
	 			{"fatal":"未设置模板封面"}
	 		]);
	 		cb(arr);
		}
	},

	check: function(cb){
		var logs = {}, me = this;
		function run(){
			me._checkThumbnail(function(re){
				if(re){
					logs[me.cover] = re;
				}
				var _logs = me._check();
				for(var k in _logs){
					logs[k] = (logs[k]||[]).concat(_logs[k]);
				}
				cb(logs);
			});
		}
		domain.on("error", function(er){
			console.log(er);
		    me.log("fatal", "未知原因导致代码检测失败");
		});
		domain.setMaxListeners(20);
		domain.run(function(){
			run();
		});
	},

	parseHTML: function(data){
		try{
			var handler = new htmlparser.DefaultHandler();
			var parser = new htmlparser.Parser(handler);
			parser.parseComplete(data);

			return handler.dom;
		}catch(e){
			return null;
		}
	},
	_createCol$Row: function(row, col){
		return row ? "(<span class='row'>" + row + "行</span>, <span class='col'>" + col + "列</span>)" : "";
	},
	//文件中是否包含不合法的资源
	hasInvalidSource: function(file, codeSegment, codeSegmentType, offsetLine){
		var file = file || this.themeObj.index, re = [], offsetLine = offsetLine||0, me = this;
		if(codeSegment){
			localFiles = staticParser.getLocalFileList(this.themeObj, "xxx." + codeSegmentType, true, codeSegment);
		}else{
			localFiles = staticParser.getLocalFileList(this.themeObj, file, true);
		}

		for(var i = 0; i < localFiles.length; i++){
			var abspath = localFiles[i].abspath;

			if(!this._isWhiteList(localFiles[i].source) && 
			   !fs.existsSync(path.join(this.themeObj.getPath(), abspath))){
			   	var pos = me._createCol$Row(localFiles[i].row, localFiles[i].col),
			   		target 	 = localFiles[i].source;
				re.push({
					"warn" : "文件中包含不存在的本地资源'" + target + "'" + pos
				});
			}
		}
		var fileData = this.themeObj.getFile(file, true),
			extSource = this.hasExtSource(fileData);

		if(extSource){
			re.concat(extSource);
		}
		return re;
	},
	//链接地址是否为站外资源
	hasExtSource: function(str){
		var re = [];
		str.replace(/['"\(]?\s*https?:\/\/([^\/'"\)]+)[\/'"\)]?/gi, function(m, j){
			if(!j.match(/((libdd|diandian)\.com)|(\.w3\.org)$/i)){
				re.push({
					"fatal":"文件中调用了外站资源'"+str+"'"
				});
			}
		});
		return re.length != 0 ? re : null;
	},
	_isWhiteList: function(url){
		if(url.match(/\{\$.*?\}/)){
			return true;
		}
		if(url.match(/['"]/)){
			return true;
		}
		if(url.match(/\s*\+.*?\+/)){
			return true;
		}
		if(url.match(/^</)){
			return true;
		}
		return false;
	},
	isInvalidSource: function(str, dirname){
		var re, dirname = dirname || "/";

		re = this.hasExtSource(str);

		if(re) return [str, 0];

		if(str.match(/^http\:\/\//)){
			return null;
		}
		//检测是否调用不存在的资源
		var _sourceUrl = str;
		if(!str.match(/^\//)){
			str = path.join(dirname, str);
		}
		str = path.join(this.themeObj.getPath(), str);
		if(!this._isWhiteList(_sourceUrl) && !fs.existsSync(str)){
			return [_sourceUrl, 1];
		}
		
		return null;
	},

	//js中是否使用js_nohtml过滤
	inJavascript: function(data){
		var re;
		if(re = data.match(/\{\$[^_]([a-zA-Z0-9]+)\}/)){
			if(!re[1].match(/\|js_nohtml/)){
				return {
					"fatal":"javascript中存在未转义的模板变量，请使用js_nohtml转义"
				};
			}
		}
		return null;
	},
	//css中是否有expression
	inCss: function(data){
		var re;
		if(re = data.match(/(e|ｅ)\s*(x|ｘ)\s*(p|ｐ)\s*(r|ｒ)\s*(e|ｅ)\s*(s|ｓ)\s*(s|ｓ)\s*(i|ｉ)\s*(o|ｏ)\s*(n|ｎ)\(/i)){
			return {
				"warn":"css中存在expression可能有安全隐患，请检查"
			};
		}
		return null;
	},

	//html属性是否正常转义及是否有调用站外资源
	//js和css加载数量不能超过3个（不包含第三方插件）
	htmlAttr: function(data){
		var dom = this.parseHTML(data), result = [], me = this, cssCount = 0, jsCount = 0;
		function T(obj){
			for(var i=0,l=obj.length;i<l;i++){
				if(obj[i].name){
					obj[i].name = obj[i].name.toLowerCase();
				}
				if(obj[i].type){
					obj[i].type = obj[i].type.toLowerCase();
				}
				if(obj[i].type == 'tag'){
					if(obj[i].name == 'script'){
						if(obj[i].attributes && obj[i].attributes.src &&
						   !obj[i].attributes.src.match(/https?:\/\//i)){
							jsCount ++;
						}
						if(obj[i].children){
							var scripts = obj[i].children[0].data, re;
							if(re = me.inJavascript(scripts)){
								result.push(re);
							}
							if(re = me.hasInvalidSource(null, scripts, "js", obj[i].location.line)){
								result = result.concat(re);
							}
						}
					}
					if(obj[i].name == 'style'){
						if(obj[i].children){
							var css = obj[i].children[0].data, re;
							if(re = me.inCss(css)){
								result.push(re);
							}
							if(re = me.hasInvalidSource(null, css, "css", obj[i].location.line)){
								result = result.concat(re);
							}
						}
					}
					if(obj[i].name != 'html'){
						if(obj[i].name == "link" && obj[i].attributes &&
						   obj[i].attributes.rel == "stylesheet" &&
						   obj[i].attributes.href &&
						  !obj[i].attributes.href.match(/https?:\/\//i)){
							cssCount ++;
						}
						
						if(obj[i].attributes){
							for(var k in obj[i].attributes){
								var attr = obj[i].attributes[k], tag = obj[i].name, row, col,
									whiteList = ['src', 'href', 'width', 'height', 'class', 'style'];
								if(obj[i].location){
									row = obj[i].location.line,
									col = obj[i].location.col;
								}
								if(! us.contains(whiteList, k)){
									var re;
									if(re = attr.match(/\{\$([^_][a-zA-Z0-9.]+)\}/)){
										if(! re[1].match(/\|nohtml/) && 
										   ! re[1].match(/\..*?(url|id|index|count|date|number)$/) &&
										   ! re[1].match(/meta\./) &&
										   ! re[1].match(/^global\.name$/) &&
										   ! re[1].match(/^post\.type$/) &&
										   ! re[1].match(/^photo\.alt$/)){
											result.push({
												"fatal": "html标签"+tag+"的"+k+"属性未添加nohtml转义"+
												me._createCol$Row(row, col)
											});
										}
									}
								}
								if(k == "src" || (obj[i].name == "link" && k == "href")){
									var re = me.isInvalidSource(attr);
									if(re){
										if(re[1] == 0){
											result.push({
												"fatal": "html标签"+tag+"的"+k+"属性调用了站外资源'"+re[0]+"'"+
														me._createCol$Row(row, col)
											});
										}else{
											result.push({
												"warn": "html标签"+tag+"的"+k+"属性调用了不存在的资源'"+re[0]+"'"+
														me._createCol$Row(row, col)
											});
										}
									}
								}
							}
						}
					}
					if(obj[i].children){
						T(obj[i].children);
					}
				}
			}
		}
		T(dom);
		if(cssCount > 3){
			result.push({
				"fatal":"引用的css文件数量大于3个"
			});
		}
		if(jsCount > 3){
			result.push({
				"fatal":"引用的js文件数量大于3个"
			});
		}
		return result;
	},

	//有无非法关键字
	invalidWord: function(data){
		var words = [],
			pattern = new RegExp("("+words.join('|')+")", "gi"),
			re, result;
		if(re = data.match(pattern)){
			re = us.union(re);
			return {"fatal":'包含非法关键字：' + re.join(",")};
		}else{
			return null;
		}
	},

	//静态文件大小不能超过100k, 图片资源大小不能大于500K
	filesize: function (filename){
		var photos = ['\\.jpg', '\\.png', '\\.gif', '\\.bmp', '\\.jpeg', '\\.tiff', '\\.tga'],
			stat = fs.existsSync(filename), filesize;
		if(!stat){
			return null;
		}

		stat = fs.statSync(filename);

		filesize = stat.size;

		if(filename.match(new RegExp('(' + photos.join('|') + ")\s*$",'i'))){
			if(filesize > 500*1024){
				return {"fatal":'图片大小不能超过500k'};
			}
		}else{
			if(filesize > 100*1024){
				return {"fatal":'文件大小不能超过100K'};
			}
		}
		return null;
	},

	//打印日志
	logs: [],
	log: function(type, msg){
		var types = {
			"warn"	: "WARNING: ",
			"fatal" : "FATAL: "
		}, _t = types[type];

		if(! _t) return;
		var log = {};

		log[_t] = console.log(msg);

		this.logs.push(log);

	}
}; 

module.exports = checker;
