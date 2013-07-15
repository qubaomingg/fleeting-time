var us 		= require('underscore');
var path 	= require('path');
var env 	= require('./setting');
var fs 		= require('fs');
var theme 	= require('./theme');
var api 	= require('../api');
var parser 	= require('./staticParser');
var dir 	= require('./dir-utils');
var ticket	= require('./ticket');
var uglifyjs 	= require('uglify-js');
var uglifycss 	= require('css-compressor').cssmin;
var domain  = require('domain').create();
var webroot	= env.get('webroot');
var TEMPDIR = path.join(webroot,'source/temp');
var KEY 	= 0, powerInfo = "<!--powered by venus-->";


domain.on("error", function(er){
	console.log(er);
    process.send({
        "type" : "fail",
        "data" : {
            "errCode" : 1,
            "errMsg"  : "模板发布失败，原因：系统内部原因"
        }
    });
});

var publish = function(lo){
	this.themeObj = theme.init(lo);
}

publish.prototype = {
	upload: function(){
		var me = this;
        domain.run(function(){
            me._parseDirTree(function(tree, log){
                var status = {errCode:0};
                if(log.length != 0){
                    status.errCode = 1;
                    status.errMsg = "文件预检测失败";
                    status.logs = log;
                    process.send({
                        "type" : "fail",
                        "data" : status
                    });
                }else{
                    process.send({
                        "type" : "success",
                        "data" : status
                    });
                    me._uploadAssets(tree);
                }
            });
        });
	},
	getUid: function(){
		return KEY++;
	},
	replaceFile: function(url, source, parent){
		var filePath = path.join(TEMPDIR, parent);
		var fileData = fs.readFileSync(filePath);
		source = this._checkRegExp(source);
		fileData = fileData.replace(new RegExp(source, "g"), url);
		fs.writeFileSync(filePath, fileData, "utf8");
	},
	_parseDirTree: function(cb){
		var me = this, log = [], tree = {};
		function T(file, parent){
			var result = parser.getLocalFileList(me.themeObj.getId(), file);
			if(result == -1){
				// log.push(["isNull", parent[file].source]);
				delete parent[file];
			}else{
				if(result.length != 0){
					parent[file].type = 1;
				}
				for(var i=0,l=result.length;i<l;i++){
					parent[file][result[i].abspath] = {
						source: result[i].source,
						parent: parent[file],
						name: result[i].abspath,
						type: 0
					};
					T(result[i].abspath, parent[file]);
				}
			}
		}
		tree[this.themeObj.index] = {
			name: this.themeObj.index,
			parent: tree
		};
		T(this.themeObj.index, tree);
		//清空重复项
		var obj = {}, _log = [];
		us.each(log, function(l,i){
			if(obj[l[1]] && obj[l[1]].k == l[0]){
				obj[l[1]].count++;
				return;
			}
			obj[l[1]] = { k: l[0], count: 1};
		});
		us.each(obj, function(l, k){
			var arr = [l, k+(l.count == 1?"":(" ("+l.count+")"))];
			_log.push(arr);
		});
		cb(tree, _log);
	},
	_checkRegExp: function(text){
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	},
	_uploadAssets: function(tree){
		var tmpDir = TEMPDIR,
			me = this;
		dir.rmdir(tmpDir, function(){
			dir.mkdir(tmpDir, '', function(){
				var themeDir = me.themeObj.getPath(), logs = {
					currentTheme: me.themeObj.getId(),
					data : []
				};
				function printLog(obj){
					logs.data.push(obj);
					var data = JSON.stringify(logs);
					fs.writeFileSync(path.join(tmpDir, 'log'), data, 'utf8');
				}
				function isValidKey(k){
					return (us.indexOf(["name","parent","source","url","type"], k)) == -1;
				}
				//深度遍历N叉树
				function T(node){
					try{
						var uploadedAll = true;
						function uploadAsset(file, origFile, onok){
							// var time = Math.random()*10;
							// setTimeout(function(){
							// 	onok({
							// 		url:"http://www.ddd.com/"+time
							// 	});
							// }, time*1000)
							// 如果js或css在lib目录下，则自动压缩上传
							if(file.match(/\/lib\/[^\/]+$/)){
								var extname 	= path.extname(file),
									filename 	= path.basename(file),
									ralFile 	= file.replace(me.themeObj.getPath(), ""),
									tempFile	= path.join(TEMPDIR, "/compress/",ralFile),
									ralFileDir 	= path.dirname(tempFile),
									fileData;

								if(extname == ".js"){
									printLog({"compressing": origFile});
									dir.mkdir(ralFileDir);
									fileData = fs.readFileSync(file, "utf8");
									fileData = uglifyjs(fileData);
									fs.writeFileSync(tempFile, fileData, "utf8");
									file = tempFile;
								}else if(extname == ".css"){
									printLog({"compressing": origFile});
									dir.mkdir(ralFileDir);
									fileData = fs.readFileSync(file, "utf8");
									fileData = uglifycss(fileData);
									fs.writeFileSync(tempFile, fileData, "utf8");
									file = tempFile;
								}
							}
							printLog({"uploading": origFile});
							api.uploadAsset({
								files: [
									file
								],
								onsuccess: function(re){
									onok({url: re.result.url});
								},
								onerror: function(re){
									console.log(re);
									printLog({
										"publishfail" : me.themeObj.getId() + "@静态文件: " + origFile + "上传失败, 原因是: " + re.meta.msg 
									});
									process.send({
										"type" : "stop"
									});
								}
							});
						}

						var v, fileData = "";
						for(k in node){
							//如果是保留属性则跳过
							if(!isValidKey(k)){
								continue;
							}
							v = node[k];
							//v.type: 0 表示为叶节点，而且为未上传状态， 1 表示非叶节点，
							//2 表示叶节点同时正在上传， 3 表示叶节点同时已经上传完成
							if(v.type == 0 || v.type == 2){
								uploadedAll = false;
								if(v.type == 0){
									//上传静态文件
									node[k].type = 2;
									var uploadOk = (function(){
										var staticFile = k;
										return function(re){
											printLog({
												"uploaded": staticFile
											});
											node[staticFile].url = re.url;
											node[staticFile].type = 3;
											T(node);
										}
									})();
									uploadAsset(path.join(themeDir, k), k, uploadOk);
								}
							}else if(v.type == 1){
								uploadedAll = false;
								T(v, node);
							}
						}
						if(uploadedAll){
							var baseName = path.basename(node.name);
							
							//该文件依赖的所有文件都上传成功，则上传自己
							var extName = path.extname(node.name),
								fileName = me.getUid()+extName,
								filePath = path.join(tmpDir, fileName),
								fileData = me.themeObj.getFile(node.name);
							printLog({
								"replacing": node.name
							});
							for(var t in node){
								if(!isValidKey(t)){
									continue;
								}
								fileData = fileData.replace(
									new RegExp(
										me._checkRegExp(node[t].source)
										, "g"
									),
									node[t].url
								);
							}
							printLog({
								"replaced": node.name
							});
							fs.writeFileSync(filePath, fileData, 'utf8');
							node.parent[node.name].type = 2;
							if(baseName != me.themeObj.index){
								var uploadOk = function(re){
									node.url = re.url;
									node.type = 3;
									printLog({
										"uploaded" : node.name
									});
									if(node.parent){
										T(node.parent);
									}
								};
								uploadAsset(filePath, node.name, uploadOk);
							}
							if(baseName == me.themeObj.index){
								//遍历至顶层节点，遍历结束
								printLog({
									"success":1
								});
								//发布模板
								printLog({
									"publishing": me.themeObj.info.name
								});
								me.publishTemplate(filePath, function(re, message){
									if(re.errCode == 0){
										var subfix = "";
										if(message){
											message = message.split('<br/>').join("</span><span class='log-info-item'>");
											message = "<span class='log-info-item'>" + message + "</span>";
											subfix = "@, 但是可能不能通过官方审核，原因是:" + message;
										}
										printLog({
											"publishok": me.themeObj.info.name + subfix
										});
									}else{
										printLog({
											"publishfail": me.themeObj.info.name+"@"+re.errMsg
										});
									}
									process.send({
										"type" : "stop"
									});
								});
							}
						}
					}catch(e){
						printLog({
							"fatal": e.message
						});
						process.send({
							"type" : "stop"
						});
					}
				}
				T(tree[me.themeObj.index]);
			});
		});
	},
	_uploadCover: function(cb){
		var coverPath = path.join(this.themeObj.id, this.themeObj.cover);

		if(! fs.existsSync(coverPath)){
			cb({
				meta: {msg: "未设置模板封面"}
			});
			return;
		}
		api.uploadCover({
			files:[
				coverPath
			],
			onsuccess: function(re){
				cb(re);
			},
			onerror: function(){
				cb();
			}
		});
	},
	publishTemplate: function(template, cb){
		var fileName = this.themeObj.info.name,
			fileDescription = this.themeObj.info.description,
			template = fs.readFileSync(template, 'utf8'),
			status = {errCode: 0}, thumbnail, theme_info_id,
			me = this;
		if(template.indexOf(powerInfo) == -1){
			template += powerInfo;
		}
		if(this.themeObj.info.theme_info_id){
			theme_info_id = this.themeObj.info.theme_info_id;
		}
		this._uploadCover(function(re){
			if(!re){
				status.errCode = 1;
				status.errMsg = "图片封面上传失败";
				cb(status);
			}else if(! re.result){
				status.errCode = 1;
				status.errMsg = re.meta.msg;
				cb(status);
			}else{
				thumbnail = re.result.url;
				var obj = {
					name: fileName,
					description: fileDescription,
					template: template,
					thumbnail: thumbnail,
					onsuccess: function(re){
						me.themeObj.setInfo({
							"theme_info_id": re.result.id
						});
						cb(status, re.result.promptMessage);
					},
					onerror: function(re){
						status.errCode = 2;
						status.errMsg = re.meta.msg;
						cb(status);
					}
				};
				if(theme_info_id){
					obj.theme_info_id = theme_info_id;
				}
				api.submitTheme(obj);
			}
		});
	}
};

themeId 	= process.argv[2];
ticketData  = process.argv[3];

ticketData = JSON.parse(ticketData);

ticket.set(ticketData.t, ticketData.user);

publisher = new publish(themeId);
publisher.upload();
