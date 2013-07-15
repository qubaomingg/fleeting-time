
var ticket = require('../lib/ticket')

module.exports = function(req, res, next) {
	var uri = req.path;

	var t = ticket.get();

	if(!t.t){
		if(canIgnore(uri)){
			next();
			return;
		}

		res.redirect('/login');
		return;
	}else{
		next();
	}
};

var ignoreUris = [ /^\/login\/?/, /^\/js\/?/, /^\/css\/?/, /^\/img\/?/, /^\/static\/?/ ];

var canIgnore = function(uri) {
	for ( var i = 0; i < ignoreUris.length; i++) {
		var ignoreUri = ignoreUris[i];
		if (uri.match(ignoreUri)) {
			return true;
		}
	}

	return false;
};
