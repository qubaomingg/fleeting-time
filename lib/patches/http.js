http = require('http');

http.createClient = function (port, host){
	var options = {
		"host": host,
		"port": port
	};

	return {
		"request" : function(method, path, headers){
			options.method 	= method;
			options.path 	= path;
			options.headers = headers;
			var httpObj = http.request(options);

			return httpObj;
		}
	};
}

module.exports = http;
