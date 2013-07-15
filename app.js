var express = require('express');
var passport = require('./middleware/passport');
var env = require('./lib/setting');
var fs = require('fs');
var path = require('path');
var logger = require('./lib/log');

var app = express.createServer();

var checkUpdate = require('./lib/checkupdate');

// config
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
// middleware
app.configure(function() {
	var writeStream = fs.createWriteStream(
		path.join(env.get('webroot'),'/log/access.log')
	);
	app.use(express.logger({
		stream: writeStream
	}));
	app.use(express.bodyParser({
        keepExtensions: true,
        uploadDir: path.join(env.get('webroot'), "/source/temp"),
        limit: '50mb'
    }));
    app.use(express.limit('50mb'));
	app.use(express.methodOverride());
	app.use(express.cookieParser('keyboard cat'));
	app.use(passport);
	app.use(app.router);
	app.use(express.static(__dirname + '/views/assets/'));
	app.use(express.errorHandler({
		dumpExceptions : true,
		showStack : true
	}));
});
//error handling
// process.on('uncaughtException', function (err) {
//   logger.fatal('Caught exception: ' + err);
// });

process.on('exit', function () {
  logger.debug('tools exit');
});

// helper
app.helpers({
	name : function(first, last) {
		return first + ', ' + last;
	},
	firstName : 'tj',
	lastName : 'holowaychuk'
});

// dynamicHelper
app.dynamicHelpers({

	currentPage : function(req, res) {
		return function() {
			var value = null;
			return {
		        get: function () {
		           return value;
		        },
		        set: function (new_value) {
		           value = new_value;
		        }
		    };
		}();
	},
	
	req : function(req, res) {
		return req;
	}
});
//清空检测文件
updateFile = path.join(webroot, "source/needversion");
checkUpdate(function(r){
	// routes
	require('./routes/home')(app);

	// start
	if (!module.parent) {
		app.listen(env.get('port'));
	}
}, function(r){
	
	var msg = r.result.message || 'Venus需要升级',
		url = r.result.location || 'http://doc.diandian.com/template/tools-intro';
	app.get('/login', function(req, res){
		res.render('updateinfo', {
			msg: msg,
			url: url
		});
		process.send({
			"type" : "update",
			"version" : r.result.version,
			"cVersion"  : r.result.currentVersion
		});
		setTimeout(function(){
			process.send('stop');	
		},1000);
	});
	app.get('/', function(req, res){
		res.redirect('/login');
	});

	// start
	if (!module.parent) {
		app.listen(env.get('port'));
	}
})
