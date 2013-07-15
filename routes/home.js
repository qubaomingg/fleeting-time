var theme = require('../lib/theme');
var client = require('../api/index');
var api = require('../api');
var path = require('path');
var fs = require('fs');
var URL = require('url');
var preview = require('../lib/preview');
var env = setting = require('../lib/setting');
var checker = require('../lib/checker');
var publisher = require('../lib/publish');
var us = require('underscore');
var ustring = require('underscore.string');
var querystring = require('querystring');
var system = require('../lib/system');
var http = require('http');
var staticParser = require('../lib/staticParser');

module.exports = function(app) {
	app.all('*', function(req, res, next){
		res.setHeader("Cache-Control", "no-cache");
		next();
	});
	app.get('/login', function(req, res) {
		res.render('login', {
			account:"",
			password:""
		});
	});

	app.get('/logout', function(req, res) {
		api.logout({
			onsuccess:function(){
				res.redirect('/login');
			},
			onerror:function(r){
				res.redirect("/error?msg="+(r.meta.msg||"无法退出，请检查网络连接"));
			}
		});
		
	});
	
	app.post('/login', function(req, res) {
		var user = req.body.user;
		api.login({
			account:user.account, 
			password:user.password,
			onsuccess:function(r) {
                api.getBlogList({
                    "oncomplete": function(bloglist){
                        setting.set({
                            "defaultPreviewBlogId" : bloglist[0].id
                        });
                        res.redirect('/');
                    }
                });
			},
			onerror:function(r){
				var msg = r.meta.msg||"请检查网络连接";
				res.render('login', {
					account: user.account,
					password: user.password,
					errorMsg: msg
				})
			}
		});
	});

	app.get('/', function(req, res){
		var obj = {
			setting: setting.getAll(),
			needToResetWorkspace: false
		};
		obj.setting.workspace = env.get('workspace');
		theme.findAll(env.get('workspace'), function(err, themes) {
			if(err == 1){
				obj.needToResetWorkspace = true;
			}
			obj.themes = themes||[];
			//获取用户博客数据
			api.getBlogList({
				"oncomplete": function(bloglist){
					obj.setting.bloglist = bloglist;
					if(!obj.setting.defaultPreviewBlogId){
						setting.set({
							"defaultPreviewBlogId" : bloglist[0].id
						});
						setting.defaultPreviewBlogId = bloglist[0].id;
					}
					api.user({
						"oncomplete": function(userdata){
							if(userdata.result){
								obj.username = userdata.result.user.name;
							}else{
								res.redirect('/login');
								return;
							}
                            res.render('home', obj);
						}
					});
				}
			});
		});
	});
	app.get('/page/:params(*)', function(req, res){
		var refer = req.headers.referer, re;
		if(!refer){
			res.redirect("/error?msg=请求地址出错");
			return;
		}
		re = refer.split('/');
		if(!re[5]){
			var set = setting.get("defaultPreviewBlogId");
			re[5] = set;
		}
		re = re.slice(0,6);
		res.redirect(re.join('/')+"/page/"+req.params.params);
	});
	app.get('/post/:params(*)', function(req, res){
		var refer = req.headers.referer, re;
		if(!refer){
			res.redirect("/error?msg=请求地址出错");
			return;
		}
		re = refer.split('/');
		if(!re[5]){
			var set = setting.get('defaultPreviewBlogId');
			re[5] = set;
		}
		re = re.slice(0,6);
		res.redirect(re.join('/')+"/post/"+req.params.params);
	});
	app.get('/themelist', function(req, res){
		theme.findAll(env.get('workspace'), function(err, themes){
			res.send(JSON.stringify(themes));
		});
	})

	app.get('/blogs/*', function(req, res){
		var data = {};

		data.req = req;
		data.res = res;
		data.blogId = req.params.blogId;
        if(req.query['isadv']){
            data.isAdvPreview = true;
        }
		preview.init(data);
	});

	app.get('/customize/*', function(req, res){
		var data = {};

		data.req = req;
		data.res = res;

		preview.customize(data);
	});

	app.get('/preview/:theme/?', function(req, res){
		var data = {}, settings = setting.getAll();

		data.req = req;
		data.res = res;
		data.blogId = settings.defaultPreviewBlogId;
		data.theme = req.params.theme;
		data.url = '/' + req.params[0]

		preview.render(data);
	});

	app.all(/\/preview\/([^\/]+)\/([^\/]+)((\/.*)*)/, function(req, res) {

		var data = {}, query;

		data.req = req;
		data.res = res;
		data.blogId = req.params[1];
		data.theme = req.params[0];
		query =  querystring.stringify(req.query)
		data.url = req.params[2]+(query?("?"+query):"");

		preview.render(data);
	});

	//mars数据接口支持
	app.get('/do/:url(*)', function(req, res){
		var data = {};
		data.url = req.url;
		data.data = req.query;
		var refer = req.headers.referer;
		refer = refer.match(/([^\/]+\.tpl\.diandian\.com)/);
		if(refer){
			data.host = refer[1];
			data.oncomplete = function(data){
				res.send(data);
			}
			api.marsDataviewProxy(data);
		}else{
			res.send("");
		}
	});
    //高级预览上传图片调试支持
    app.post('/image/token', function(req, res){
        res.send("32c7cc99-34ba-4036-b339-5fbaf4de15ee");
    });
    app.post('/upload', function(req, res){
        var file = req.files.formdata.path,
            cb   = req.query['callback'];
        api.uploadAsset({
            "files" : [file],
            "oncomplete": function(data){
                fs.unlinkSync(file);
                var tpl = '<!doctype html><html><head><script>try{parent.'+cb+'({"id":"VENUS_UPLOAD","url":"'+data.result.url+'"});}catch(ex){}</script></head><body></body></html>';
                res.send(tpl);
            }
        });
    });

    app.get('/previewadv/:theme/?', function(req, res){
        var data = {}, settings = setting.getAll();

        data.req = req;
        data.res = res;
        data.blogId = settings.defaultPreviewBlogId;
        data.theme = req.params.theme;
        data.url = '/' + req.params[0]

        preview.renderAdv(data);
    });

    app.all(/\/previewadv\/([^\/]+)\/([^\/]+)((\/.*)*)/, function(req, res) {

        var data = {}, query;

        data.req = req;
        data.res = res;
        data.blogId = req.params[1];
        data.theme = req.params[0];
        query =  querystring.stringify(req.query)
        data.url = req.params[2]+(query?("?"+query):"");

        preview.renderAdv(data);
    });

	app.get('/static-proxy/:theme/*', function(req, res){
		var data = {};

		data.req = req;
		data.res = res;
		data.theme = req.params.theme;
		data.url = '/' + req.params[0];

		preview.serverStatic(data);
	});

    app.get('/template-proxy/:theme/?', function(req, res){
        var themeId = req.params.theme,
            Theme = theme.init(themeId);

        var re = {};

        re.html = staticParser.replaceLocalFile(themeId, Theme.index);

        res.send(JSON.stringify(re));
    });
    app.post("/template-proxy/customize/preview/:blogUrl", function(req, res){
        var blogUrl = req.params.blogUrl;

        var data = req.body;

        api.getCustomizeProxyData({
            url: "/customize/preview/" + blogUrl,
            data: {formKey: data.formKey, html: data.html},
            onsuccess: function(data){
                res.send(data);
            }
        });
    });
    app.all("/tplpreview-proxy/:path(*)", function(req, res){
        var url = "http://" + decodeURIComponent(req.params.path),
            requestUrl = req.headers['host'];
        url = URL.parse(url);
        var data = {
            "host" : url.host,
            "url"  : url.path
        };
        data.data = req.body;
        data.oncomplete = function(data){
            //替换地址
            var pattern  = new RegExp(url.host.replace(/([\.\$\^\{\[\(\|\)\*\+\?\\])/g, "\\$1"), "g");
            data = data.replace(pattern, requestUrl + "/tplpreview-proxy/" + url.host);
            res.setHeader("Content-Type", "text/html");
            res.send(data);
        };
        data.onerror = function(){
            res.send("请求预览模板出错。");
        };
        api.tplPreviewProxy(data);
    });
    app.post("/customize/logs/*", function(req, res){
        var data = req.body;
        api.getCustomizeProxyData({
            url: req.url,
            data: {formKey: data.formKey, sequenceId: data.sequenceId},
            onsuccess: function(data){
                res.send(data);
            }
        });
    });
	//保存为常用配置
	app.post('/theme/saveas/default', function(req, res){
		var meta = req.body.theme;

		theme.saveAsDefault(meta, function(err){
			res.send(JSON.stringify(err));
		});
	});

	//快速新建
	app.post('/theme/quickcreate', function(req, res){
		theme.quickCreate(function(err){
			res.send(JSON.stringify(err));
		});
	});

	app.get('/theme/:folder/:file(img/*)', function(req, res) {
		
		var folder = req.params.folder;
		var file = req.params.file;

		var location = path.join(env.get('workspace'), folder);
		res.download(path.join(location, file));
	});

	app.get('/theme/:theme/:blogId/*', function(req, res) {

		var data = {};

		data.req = req;
		data.res = res;
		data.blogId = req.params.blogId;
		data.theme = req.params.theme;

		preview.render(data);
	});

	app.get('/theme/:folder/:file(assets/*)', function(req, res) {
		
		var folder = req.params.folder;
		var file = req.params.file;

		var location = path.join(env.get('workspace'), folder);
		res.download(path.join(location, file));
	});
	
	app.get('/theme/:folder/upload', function(req, res) {
		var folder = req.params.folder;
		var ticket = req.cookies.t;

		var location = path.join(env.get('workspace'), folder);
		theme.findOne(location, function(err, theme) {
			if (err) {
				throw err;
			}
			
			var files = [];
			
			theme.files.css.forEach(function(info) {
				files.push(info.file);
			});
			
			
			client.upload(ticket, files, [], function(err, html){
				if (err) {
					throw err;
				}
				
				
				res.send(html);
			});
			
			
		});
	});

	app.get('/n/common/comment*', function(req, res){
		client.getComments({
			data: querystring.stringify(req.query),
			onsuccess: function(data){
				res.send(data);
			}
		});
	});
	app.get('/comment_data_proxy/:blogUrl/:data(*)', function(req, res){
		var query = querystring.stringify(req.query),
			blogUrl = req.params.blogUrl, 
			data = req.params.data;

		client.commentProxy({
			data: path.join("/", data + (query?("?"+query):"")),
			host: "www.diandian.com",
			onsuccess: function(data){
				res.send(data);
			}
		});
	})
	app.get('/notes?*', function(req, res){
		client.getNotes({
			data: querystring.stringify(req.query),
			onsuccess: function(data){
				res.send(data);
			}
		});
	});

	app.post('/theme', function(req, res) {
		var meta = req.body.theme;

		theme.findOne(theme.template,
			function(err, template) {
				var status = { errCode: 0, errMsg: ''};
				if (err != 0) {
					status.errCode = -1;
					status.errMsg = "模板保存出错";
					res.send(JSON.stringify(status));
				}
				var location = path.join(env.get('workspace'), meta.folder);
				theme.create(location, {
					name : meta.name,
					description : meta.description,
					jsrequire   : meta.jsrequire,
					cssrequire  : meta.cssrequire,
					folder: meta.folder
				}, template, function(err) {
					if (err.errCode != 0) {
						status.errCode = err.errCode;
						status.errMsg = err.errMsg;
					}
					res.send(JSON.stringify(status));
				});
			}
		);
	});

	//保存为常用配置
	app.post('/theme/saveas/default', function(req, res){
		var meta = req.body.theme;

		theme.saveAsDefault(meta, function(err){
			res.send(JSON.stringify(err));
		});
	});

	//快速新建
	app.post('/theme/quickcreate', function(req, res){
		theme.quickCreate(function(err){
			res.send(JSON.stringify(err));
		});
	});
	//修改模板信息
	app.post('/theme/change/:type', function(req, res){
		var type = req.params.type, re;
		if(type == "name"){
			re = theme.changeName(req.body.url, req.body.val);
		}

		if(type == "description"){
			re = theme.changeDescription(req.body.url, req.body.val);
		}
		res.send(JSON.stringify(re));
	});
	app.post('/setting', function(req, res){
		var data = req.body.setting, status = {
			errCode:0
		}, name = ustring.trim(data.name||""),
		   dir = ustring.trim(data.dir||""),
		   workspace = ustring.trim(data.workspace||""),
		   hostname = ustring.trim(data.hostname||""),
		   ip = ustring.trim(data.ip||""),
		   port = ustring.trim(data.port||""),

		   oriSetting = setting.getAll();

		if(
			(!!ip && ip != oriSetting['ip'])
			|| (!!port && port != oriSetting['port'])
			|| (hostname != oriSetting['hostname'])
		){
			var testServer = http.createServer(function(req, res){
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.end('venus');
			});
			testServer.listen(port, ip);

			testServer.once('error', function(err){
				res.send(JSON.stringify({"errCode":5, "errMsg":"IP或端口不可用"}));
			})

			testServer.once('listening', function(){
				status = setting.set({
					"hostname": hostname||"",
					"ip":ip,
					"port":port
				});

				res.send(JSON.stringify({"errCode":-1, "errMsg":"保存设置成功, 正在重启服务...", "location":setting.get('hostname')}));

				process.send('restart');
			})
		}else{
			status = setting.set({
				"themeNamePre": name,
				"dirNamePre": dir,
				"defaultPreviewBlogId": data.blog,
				"workspace": workspace
			});
            if(status.forceRestart){
                res.send(JSON.stringify({"errCode":-1, "errMsg":"保存设置成功, 正在重启服务...", "location":setting.get('hostname')}));

                process.send('restart');
            }else{
			    res.send(JSON.stringify(status));
            }
		}
	});
	app.post('/theme/check/:theme', function(req, res){
		var theme = req.params.theme, logs = {errCode:1, errMsg:"主题不存在"};
		if(theme){
			var t = new checker(path.join(env.get('workspace'), theme));
			if(t){
				t.check(function(_logs){
					logs.result = _logs;
					logs.errCode = 0;
					delete logs.errMsg;
					res.send(JSON.stringify(logs));
				});
			}
		}
	});
	app.post('/theme/publish/:theme', function(req, res){
		var theme = req.params.theme, logs = {errCode:1, errMsg:"主题不存在"};
		if(theme){
			publisher(theme, function(data){
				res.send(JSON.stringify(data));
			});
		}
	});
	app.post('/theme/publish/log/:theme', function(req, res){
		var theme = req.params.theme, logs = {errCode:0},
			logPath = path.join(env.get('webroot'),'source/temp/log');
		if(!fs.existsSync(logPath)){
			logs.errCode = 2;
			logs.errMsg = "日志不存在";
		}else if(theme){
			var data = fs.readFileSync(logPath, "utf8"),
				data = JSON.parse(data);
			if(data.currentTheme != theme){
				logs.errCode = 3;
				logs.errMsg = "请求的日志不是当前正在上传的主题";
			}else{
				logs.data = data.data;
			}
		}
		res.send(JSON.stringify(logs));
	});

	app.get('/login', function(req, res) {
		res.render('login', {});
	});

	app.get('/test', function(req, res) {
		res.redirect('/login');
	});

	app.get('/setting', function(req, res) {
		res.render('setting', {
			data : {}
		});
	});

	app.get('/update', function(req, res) {
		res.render('about', {
			data : {}
		});
	});

	app.get('/about', function(req, res) {
		res.render('about', {
			data : {}
		});
	});
	
	app.get('/logout', function(req, res) {
		res.clearCookie('t');
		res.redirect('/login');
	});
	
	app.post('/login', function(req, res) {
		var user = req.body.user;
		client.login(user.account, user.password, function(err, data) {
			if (err) {
				res.render('login', {errorMsg: err.message});
			} else {
				res.cookie('t', data, {
					path : '/'
				});
				res.redirect('/');
			}
		});
	});
	app.get('/error', function(req, res){
		res.render('error',{
			errorMsg: req.query.msg
		})
	});

	app.get('/system/stop', function(req, res){
		res.render('error',{
			errorMsg: 'Stopped'
		})

		system.stop();
	});

	app.get('/system/restart', function(req, res){
		res.render('error',{
			errorMsg: 'Restarting...'
		})

		system.restart();
	});


};
