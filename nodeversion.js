express = require('express');
path 	= require('path');
http 	= require('http');
app 	= express.createServer();
webroot = path.resolve(__dirname);
fs 		= require('fs');

currentVersion = process.argv[2],
needVersion	   = process.argv[3] + ".*";


defaultConfig = fs.readFileSync(path.join(webroot, "source/config.all"));

defaultConfig = JSON.parse(defaultConfig);
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
	res.render('nodeversion', {
		"current" : currentVersion,
		"need"	  : needVersion
	});
	setTimeout(function(){
		process.send('stop');
	}, 1000);
});

app.get('/login', function(req, res){
	res.redirect('/');
});

// start
if (!module.parent) {
	app.listen(defaultConfig.port.default);
}