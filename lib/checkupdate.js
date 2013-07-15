path = require('path');
http = require('../lib/patches/http');
fs = require('fs');
_ = require('underscore.string');
webroot = path.resolve(__dirname + '/../');
version = fs.readFileSync(path.join(webroot, "source/version"), 'utf8');

version = _.trim(version);

function checkUpdate(noupdate, update){
	var client = http.createClient(80, "www.diandian.com"),
		url = '/themes/sdk/v1/release?version=' + encodeURIComponent(version);

	var headers = {
		'Host' : 'www.diandian.com'
	};

	var request = client.request('GET', url, headers);

	request.on('error', function(error) {
		console.log('GET VENUS CONSTANT ERROR');
	});

	request.on('response', function(response) {
		response.setEncoding("utf8");
		var result = [];

		response.on('data', function(chunk) {
			result.push(chunk);
		});

		response.on('end', function() {
			result = JSON.parse(result.join());

			if(result.result.update == false){
				noupdate(result);
			}else{
				update(result);
			}
		});
	});

	request.end();
}

module.exports = checkUpdate;
