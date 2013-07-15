var querystring = require('querystring');
var http = require('../lib/patches/http');
var ticket = require('../lib/ticket');
var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var env = require('../lib/setting');
var logger = require('../lib/log');
var querystring = require('querystring');

var HOST = 'www.diandian.com';
var boundary = '------WebKitFormBoundary' + Math.random();
var mimeTypes  = {
	"": "text/plain",
	"html": "text/html",
	"css": "text/css",
	"jpeg": "image/jpeg",
	"jpg": "image/jpeg",
	"js": "text/javascript",
	"json": "application/json",
	"png": "image/png",
	"svg": "image/svg+xml",
	"swf": "application/x-shockwave-flash",
	"tar": "application/x-tar",
	"tgz": "application/x-tar-gz",
	"txt": "text/plain",
	"wav": "audio/x-wav",
	"xml": "text/xml",
	"zip": "application/zip",
	"ico": "image/x-icon",
	"flv": "video/x-flv",
	"gif": "image/gif"
}, encoding = 'utf8';

function apiOnEndHandler(result, param, caller, callbacks){
	try{
		result = JSON.parse(result.join(''));
		if(! result.meta){
			result.meta = {
				code: 200
			};
		}
	}catch(e){
		logger.error(caller+":",e.message, result);
		result = {meta:{
			'msg' : '数据返回异常，请检查网络连接'
		}};
	}
	callbacks = _.extend({
		onOk: function(){},
		onFail: function(){}
	}, callbacks||{});

	if(_.isFunction(param.oncomplete)){
		param.oncomplete(result);
	}

	if(result.meta.code == 200){
		callbacks.onOk(result);
		if(_.isFunction(param.onsuccess)){
			param.onsuccess(result);
		}
	}

	if(result.meta.code != 200){
		callbacks.onFail();
		logger.error('LOGIN:', result);
		if(_.isFunction(param.onerror)){
			param.onerror(result);
		}
	}
}
function apiOnErrorHandler(result, param){

}

exports.login = function(param) {
	var data = querystring.stringify({account : param.account, password : param.password});
	var client = http.createClient(80, HOST);

	var headers = {
		'Host' : HOST,
		'Content-Type' : 'application/x-www-form-urlencoded',
		'Content-Length' : Buffer.byteLength(data, 'utf8')
	};

	var request = client.request('POST', '/themes/sdk/v1/ticket', headers);

	request.on('response', function(response) {
		response.setEncoding("utf8");
		var result = [];

		response.on('data', function(chunk) {
			result.push(chunk);
		});

		response.on('end', function() {
			apiOnEndHandler(result, param, 'LOGIN', {
				onOk: function(re){
					ticket.set(re.result.ticket, re.result.id);
				}
			});
		});
	});

	request.write(data);
	request.end();
};

exports.logout = function(param) {
	var param = param || {};
	var data = querystring.stringify({});
	var client = http.createClient(80, HOST);
	var t = ticket.get();

	if(!!t.t){

		var headers = {
			'Host' : HOST,
			'Content-Type' : 'application/x-www-form-urlencoded',
			'Content-Length' : Buffer.byteLength(data, 'utf8'),
			'Cookie':'t=' + t.t
		};

		var request = client.request('DELETE', '/themes/sdk/v1/ticket', headers);

		request.on('response', function(response) {
			response.setEncoding("utf8");
			var result = [];

			response.on('data', function(chunk) {
				result.push(chunk);
			});

			response.on('end', function() {
				apiOnEndHandler(result, param, 'LOGOUT');
			});
		});

		request.write(data);
		request.end();
	}else{

		if(_.isFunction(param.oncomplete)){
			param.oncomplete({meta:{code:-403, msg:'Not Login'}});
		}

		if(_.isFunction(param.onerror)){
			param.onerror({meta:{code:-403, msg:'Not Login'}});
		}
	}
};

exports.user = user = function(param) {
	var data = querystring.stringify({});
	var client = http.createClient(80, HOST);
	var t = ticket.get();

	if(!!t.t){
		var headers = {
			'Host' : HOST,
			'Cookie' : 't=' + t.t
		};

		var request = client.request('GET', '/themes/sdk/v1/user', headers);

		request.on('response', function(response) {
			response.setEncoding("utf8");
			var result = [];

			response.on('data', function(chunk) {
				result.push(chunk);
			});

			response.on('end', function() {
				apiOnEndHandler(result, param, 'USER');
			});
		});

		request.on('error', function(error) {
			if(_.isFunction(param.onerror)){
				param.onerror(error);
			}
		});

		request.write(data);
		request.end();
	}else{
		if(_.isFunction(param.oncomplete)){
			param.oncomplete({meta:{code:-403, msg:'Not Login'}});
		}

		if(_.isFunction(param.onerror)){
			param.onerror({meta:{code:-403, msg:'Not Login'}});
		}
	}
};

exports.preview = function(param) {

    var data = querystring.stringify({
        template : param.template,
        blogId : param.blogId,
        uri : param.uri,
        localInfo : JSON.stringify(param.localInfo)
    });
    var client = http.createClient(80, HOST);
    var t = ticket.get();

    if(!!t.t){
        var headers = {
            'Host' : HOST,
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length' : Buffer.byteLength(data, 'utf8'),
            'Cookie' : 't=' + t.t
        };

        var request = client.request('POST', '/themes/sdk/v1/theme/preview', headers);

        request.on('response', function(response) {
            response.setEncoding("utf8");
            var result = [];

            response.on('data', function(chunk) {
                result.push(chunk);
            });

            response.on('end', function() {
                apiOnEndHandler(result, param, 'PREVIEW');
            });
        });

        request.on('error', function(error) {
            if(_.isFunction(param.onerror)){
                param.onerror(error);
            }
        });

        request.write(data);
        request.end();
    }else{
        if(_.isFunction(param.oncomplete)){
            param.oncomplete({meta:{code:-403, msg:'Not Login'}});
        }

        if(_.isFunction(param.onerror)){
            param.onerror({meta:{code:-403, msg:'Not Login'}});
        }
    }
};

exports.previewAdv = function(param) {
	
	var data = querystring.stringify({
			template : param.template,
			blogId : param.blogId,
			uri : param.uri,
			localInfo : JSON.stringify(param.localInfo)
		});
	var client = http.createClient(80, HOST);
	var t = ticket.get();

	if(!!t.t){
		var headers = {
			'Host' : HOST,
			'Content-Type' : 'application/x-www-form-urlencoded',
			'Content-Length' : Buffer.byteLength(data, 'utf8'),
			'Cookie' : 't=' + t.t
		};

        var params = {
            "tpl": param.theme
        };

        params = querystring.stringify(params);

		var request = client.request('GET', '/customize/venus/' + param.blogUrl + "?" + params, headers);

		request.on('response', function(response) {
			response.setEncoding("utf8");
			var result = [];

			response.on('data', function(chunk) {
				result.push(chunk);
			});

			response.on('end', function() {
				var code = response.statusCode;
				
				result = result.join('');

				if(_.isFunction(param.oncomplete)){
					param.oncomplete(result);
				}

				if(code == 200){
					if(_.isFunction(param.onsuccess)){
						param.onsuccess(result);
					}
				}

				if(code != 200){
					if(_.isFunction(param.onerror)){
						param.onerror(result);
					}
				}
			});
		});

		request.on('error', function(error) {
			if(_.isFunction(param.onerror)){
				param.onerror(error);
			}
		});

		request.write(data);
		request.end();
	}else{
		if(_.isFunction(param.oncomplete)){
			param.oncomplete({meta:{code:-403, msg:'Not Login'}});
		}

		if(_.isFunction(param.onerror)){
			param.onerror({meta:{code:-403, msg:'Not Login'}});
		}
	}
};

exports.getComments = function(param){
	var data = querystring.stringify({});
	var client = http.createClient(80, HOST);
	var t = ticket.get();

	if(!!t.t){
		var headers = {
			'Host' : HOST,
			'Cookie' : 't=' + t.t
		};
		var request = client.request('GET', '/n/common/comment?' + param.data, headers);

		request.on('response', function(response) {
			response.setEncoding("utf8");
			var result = [];

			response.on('data', function(chunk) {
				result.push(chunk);
			});

			response.on('end', function(res) {
				var code = response.statusCode;
				
				result = result.join('');

				if(_.isFunction(param.oncomplete)){
					param.oncomplete(result);
				}

				if(code == 200){//更换域名
					result = result.replace(/(ENV\.PAGE_VARS\s*=\s*\{[\s\n]*?urlDomain\s*:\s*')([^']+)(')/, function(m, j, k, l){
						var url = j+(path.join(env.get("hostname"),"comment_data_proxy",k))+l;
						return url.replace(/\\/g, "/");
					});
					if(_.isFunction(param.onsuccess)){
						param.onsuccess(result);
					}
				}

				if(code != 200){
					if(_.isFunction(param.onerror)){
						param.onerror(result);
					}
				}
			});
		});

		request.on('error', function(error) {
			if(_.isFunction(param.onerror)){
				param.onerror(error);
			}
		});

		request.write(data);
		request.end();
	}else{
		if(_.isFunction(param.oncomplete)){
			param.oncomplete({meta:{code:-403, msg:'Not Login'}});
		}

		if(_.isFunction(param.onerror)){
			param.onerror({meta:{code:-403, msg:'Not Login'}});
		}
	}
};

exports.getNotes = function(param){
	var data = querystring.stringify({});
	var client = http.createClient(80, HOST);
	var t = ticket.get();

	if(!!t.t){
		var headers = {
			'Host' : HOST,
			'Cookie' : 't=' + t.t
		};

		var request = client.request('GET', '/notes?' + param.data, headers);

		request.on('response', function(response) {
			response.setEncoding("utf8");
			var result = [];

			response.on('data', function(chunk) {
				result.push(chunk);
			});

			response.on('end', function(res) {
				apiOnEndHandler(result, param, 'GETNOTES');
			});
		});

		request.on('error', function(error) {
			if(_.isFunction(param.onerror)){
				param.onerror(error);
			}
		});

		request.write(data);
		request.end();
	}else{
		if(_.isFunction(param.oncomplete)){
			param.oncomplete({meta:{code:-403, msg:'Not Login'}});
		}

		if(_.isFunction(param.onerror)){
			param.onerror({meta:{code:-403, msg:'Not Login'}});
		}
	}
};
exports.commentProxy = function(param){
	var data = querystring.stringify({});
	var client = http.createClient(80, HOST);
	var t = ticket.get();

	if(!!t.t){
		var headers = {
			'Host' : param.host,
			'Cookie' : 't=' + t.t
		};

		param.data = param.data.replace(/\\/g, "/");

		var request = client.request('GET', param.data, headers);

		request.on('response', function(response) {
			response.setEncoding("utf8");
			var result = [];

			response.on('data', function(chunk) {
				result.push(chunk);
			});

			response.on('end', function(res) {
				var code = response.statusCode;
				
				result = result.join('');

				if(_.isFunction(param.oncomplete)){
					param.oncomplete(result);
				}

				if(code == 200){
					if(_.isFunction(param.onsuccess)){
						param.onsuccess(result);
					}
				}

				if(code != 200){
					if(_.isFunction(param.onerror)){
						param.onerror(result);
					}
				}
			});
		});

		request.on('error', function(error) {
			if(_.isFunction(param.onerror)){
				param.onerror(error);
			}
		});

		request.write(data);
		request.end();
	}else{
		if(_.isFunction(param.oncomplete)){
			param.oncomplete({meta:{code:-403, msg:'Not Login'}});
		}

		if(_.isFunction(param.onerror)){
			param.onerror({meta:{code:-403, msg:'Not Login'}});
		}
	}
};


function encodeField(boundary, name, value) {
	var data = [];
	data.push('--');
	data.push(boundary);
	data.push('\r\n');
	data.push('Content-Disposition: form-data; name="');
	data.push(name);
	data.push('"\r\n\r\n');
	data.push(value);
	data.push('\r\n');
	return new Buffer(data.join(''), encoding);
}

function encodeFields(boundary, fields) {
	var buffers = [];
	fields = fields || {};
	for(var prop in fields) {
		if (typeof(fields[prop]) != "function") {
			continue;
		}
		var field = encodeField(boundary, prop, fields[prop]);
		buffers.push(field);
	}
	return buffers;
}

function encodeFile(boundary, file, name) {

	var buffers = [];
	
	var filename = path.basename(file);
	var extname = path.extname(file);
	var type = '';
	if (extname in mimeTypes) {
		type = mimeTypes[extname];
	}
	
	var data = [];
	data.push('--');
	data.push(boundary);
	data.push('\r\n');
	data.push('Content-Disposition: form-data; name="');
	data.push(name);
	data.push('"; filename="');
	data.push(filename);
	data.push('"\r\n');
	data.push('Content-Type: ');
	data.push(type);
	data.push('\r\n\r\n');
	
	var content = fs.readFileSync(file);
	
	buffers.push(new Buffer(data.join(''), encoding));
	buffers.push(content);
	buffers.push(new Buffer('\r\n--' + boundary + '--'), encoding);
	
	return buffers;
}

function encodeFiles(boundary, files) {
	var buffers = [];
	_.each(files,function(file, index) {
		var name = 'file' + index;
		buffers = buffers.concat(encodeFile(boundary, file, name));
	});
	
	return buffers;
}

function encodeRequestBody(fields, files) {
	var buffers = [];
	
	buffers = buffers.concat(encodeFields(boundary, fields));
	buffers = buffers.concat(encodeFiles(boundary, files));
	
	return buffers;
}

function length(buffers) {
	var length = 0;
	for(var i = 0; i < buffers.length; i++) {
		length += buffers[i].length;
	}
	return length;
}

exports.uploadCover = function(param) {
	var data = querystring.stringify({});
	var client = http.createClient(80, HOST);
	var t = ticket.get();

	if(!!t.t){
		var buffers = encodeRequestBody({}, param.files);
		var contentLength = length(buffers);
		
		var headers = {
			'Host' : HOST,
			'Content-Type' : 'multipart/form-data; boundary=' + boundary,
			'Content-Length' : contentLength,
			'Cookie' : 't=' + t.t
		};

		var request = client.request('POST', '/themes/sdk/v1/theme/cover', headers);

		request.on('response', function(response) {
			response.setEncoding("utf8");
			var result = [];

			response.on('data', function(chunk) {
				result.push(chunk);
			});

			response.on('end', function() {
				apiOnEndHandler(result, param, 'UPLOADCOVER');
			});
		});

		request.on('error', function(error) {
			if(_.isFunction(param.onerror)){
				param.onerror(error);
			}
		});

		for(var i = 0; i < buffers.length; i++) {
			request.write(buffers[i]);
		}
		
		request.end();
	}else{
		if(_.isFunction(param.oncomplete)){
			param.oncomplete({meta:{code:-403, msg:'Not Login'}});
		}

		if(_.isFunction(param.onerror)){
			param.onerror({meta:{code:-403, msg:'Not Login'}});
		}
	}
};


exports.uploadAsset = function(param) {
	var data = querystring.stringify({});
	var client = http.createClient(80, HOST);
	var t = ticket.get();

	if(!!t.t){
		var buffers = encodeRequestBody({}, param.files);
		var contentLength = length(buffers);
		
		var headers = {
			'Host' : HOST,
			'Content-Type' : 'multipart/form-data; boundary=' + boundary,
			'Content-Length' : contentLength,
			'Cookie' : 't=' + t.t
		};

		var request = client.request('POST', '/themes/sdk/v1/asset', headers);

		request.on('response', function(response) {
			response.setEncoding("utf8");
			var result = [];

			response.on('data', function(chunk) {
				result.push(chunk);
			});

			response.on('end', function() {
				apiOnEndHandler(result, param, 'UPLOADASSETS');
			});
		});

		request.on('error', function(error) {
			if(_.isFunction(param.onerror)){
				param.onerror(error);
			}
		});

		for(var i = 0; i < buffers.length; i++) {
			request.write(buffers[i]);
		}
		
		request.end();
	}else{
		if(_.isFunction(param.oncomplete)){
			param.oncomplete({meta:{code:-403, msg:'Not Login'}});
		}

		if(_.isFunction(param.onerror)){
			param.onerror({meta:{code:-403, msg:'Not Login'}});
		}
	}
};

exports.submitTheme = function(param) {
	param.theme_info_id = param.theme_info_id || 0;
	var data = querystring.stringify({
		theme_info_id : param.theme_info_id, 
		name : param.name, 
		template : param.template, 
		thumbnail : param.thumbnail, 
		description : param.description
	});
	var client = http.createClient(80, HOST);
	var t = ticket.get();

	if(!!t.t){
		var headers = {
			'Host' : HOST,
			'Content-Type' : 'application/x-www-form-urlencoded',
			'Content-Length' : Buffer.byteLength(data, 'utf8'),
			'Cookie' : 't=' + t.t
		};

		var request = client.request('POST', '/themes/sdk/v1/theme', headers);

		request.on('response', function(response) {
			response.setEncoding("utf8");
			var result = [];

			response.on('data', function(chunk) {
				result.push(chunk);
			});

			response.on('end', function() {
				apiOnEndHandler(result, param, 'SUBMITTHEME');
			});
		});

		request.on('error', function(error) {
			if(_.isFunction(param.onerror)){
				param.onerror(error);
			}
		});

		request.write(data);
		request.end();
	}else{
		if(_.isFunction(param.oncomplete)){
			param.oncomplete({meta:{code:-403, msg:'Not Login'}});
		}

		if(_.isFunction(param.onerror)){
			param.onerror({meta:{code:-403, msg:'Not Login'}});
		}
	}
};

exports.releaseInfo = function(param) {
	
	var client = http.createClient(80, HOST);
	var t = ticket.get();

	var headers = {
		'Host' : HOST
	};

	if (t.t) {
		headers['Cookie'] = 't=' + t.t;
	}

	var request = client.request('GET', '/themes/sdk/v1/release', headers);

	request.on('response', function(response) {
		response.setEncoding("utf8");
		var result = [];

		response.on('data', function(chunk) {
			result.push(chunk);
		});

		response.on('end', function() {
			apiOnEndHandler(result, param, 'RELEASEINFO');
		});
	});

	request.on('error', function(error) {
		if(_.isFunction(param.onerror)){
			param.onerror(error);
		}
	});

	request.end();
	
};


exports.constants = constants = function(param) {
	
	var client = http.createClient(80, HOST);
	var t = ticket.get();

	var headers = {
		'Host' : HOST
	};

	if (t.t) {
		headers['Cookie'] = 't=' + t.t;
	}

	var request = client.request('GET', '/themes/sdk/v1/constants', headers);

	request.on('response', function(response) {
		response.setEncoding("utf8");
		var result = [];

		response.on('data', function(chunk) {
			result.push(chunk);
		});

		response.on('end', function() {
			apiOnEndHandler(result, param, 'CONSTANTS');
		});
	});

	request.on('error', function(error) {
		if(_.isFunction(param.onerror)){
			param.onerror(error);
		}
	});

	request.end();
	
};

exports.status = status = function(param) {
	
	var client = http.createClient(80, HOST);
	var t = ticket.get();

	var headers = {
		'Host' : HOST
	};

	if (t.t) {
		headers['Cookie'] = 't=' + t.t;
	}

	var request = client.request('GET', '/themes/sdk/v1/theme/mines', headers);

	request.on('response', function(response) {
		response.setEncoding("utf8");
		var result = [];

		response.on('data', function(chunk) {
			result.push(chunk);
		});

		response.on('end', function() {
			apiOnEndHandler(result, param, 'GETSTATUS');
		});
	});

	request.on('error', function(error) {
		if(_.isFunction(param.onerror)){
			param.onerror(error);
		}
	});

	request.end();
	
};

exports.getBlogList = function(param){
	var result = [];
	user({
		oncomplete:function(r){
			if(r.meta.code == 200){
				result = r.result.blogs;
                if(param.personalOnly){
                    if (_.isFunction(param.oncomplete)) {
                        param.oncomplete(result);
                    }
                    return null;
                }
			}
			constants({
				oncomplete: function(data){
					if(data.meta.code == 200){
						var publicBlogs = data.result.publicBlogs;
						result = result.concat(publicBlogs);
					}
					if (_.isFunction(param.oncomplete)) {
						param.oncomplete(result);
					}
				}
			});
			
		}
	})
}

exports.getCustomizeProxyData = function(param){
    var data = querystring.stringify(param.data);
    var client = http.createClient(80, HOST);
    var t = ticket.get();
    if(!!t.t){
        var headers = {
            'Host' : HOST,
            'Cookie' : 't=' + t.t,
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length' : Buffer.byteLength(data, 'utf8')
        };

        var request = client.request('POST', param.url, headers);

        request.on('response', function(response) {
            response.setEncoding("utf8");
            var result = [];

            response.on('data', function(chunk) {
                result.push(chunk);
            });

            response.on('end', function(res) {
                var code = response.statusCode;

                result = result.join('');

                if(_.isFunction(param.oncomplete)){
                    param.oncomplete(result);
                }

                if(code == 200){
                    if(_.isFunction(param.onsuccess)){
                        param.onsuccess(result);
                    }
                }

                if(code != 200){
                    if(_.isFunction(param.onerror)){
                        param.onerror(result);
                    }
                }
            });
        });

        request.on('error', function(error) {
            if(_.isFunction(param.onerror)){
                param.onerror(error);
            }
        });

        request.write(data);
        request.end();
    }else{
        if(_.isFunction(param.oncomplete)){
            param.oncomplete({meta:{code:-403, msg:'Not Login'}});
        }

        if(_.isFunction(param.onerror)){
            param.onerror({meta:{code:-403, msg:'Not Login'}});
        }
    }
}

exports.tplPreviewProxy = function(param) {
    var data = querystring.stringify(param.data);
    if(data == "{}") data = "";
    var client = http.createClient(80, HOST);
    var t = ticket.get();

    if(!!t.t){
        var headers = {
            'Host' : param.host,
            'Cookie' : 't=' + t.t
        };
        if(data){
            headers['Content-Type']     = 'application/x-www-form-urlencoded';
            headers['Content-Length']   = Buffer.byteLength(data, 'utf8');
        }

        var request = client.request(data ? 'POST' : 'GET', param.url, headers);

        request.on('response', function(response) {
            response.setEncoding("utf8");
            var result = [];

            response.on('data', function(chunk) {
                result.push(chunk);
            });

            response.on('end', function() {
                if(_.isFunction(param.oncomplete)){
                    param.oncomplete(result.join(''));
                }
            });
        });

        request.on('error', function(error) {
            if(_.isFunction(param.onerror)){
                param.onerror(error);
            }
        });

        request.write(data);
        request.end();
    }else{
        if(_.isFunction(param.oncomplete)){
            param.oncomplete({meta:{code:-403, msg:'Not Login'}});
        }

        if(_.isFunction(param.onerror)){
            param.onerror({meta:{code:-403, msg:'Not Login'}});
        }
    }
};
exports.marsDataviewProxy = function(param){
    var client = http.createClient(80, HOST);
    var t = ticket.get();

    if(!!t.t){
        var headers = {
            'Host' : param.host,
            'Cookie' : 't=' + t.t
        };
        var request = client.request('GET', param.url, headers);

        request.on('response', function(response) {
            response.setEncoding("utf8");
            var result = [];

            response.on('data', function(chunk) {
                result.push(chunk);
            });

            response.on('end', function() {
                if(_.isFunction(param.oncomplete)){
                    param.oncomplete(result.join(''));
                }
            });
        });

        request.on('error', function(error) {
            if(_.isFunction(param.onerror)){
                param.onerror(error);
            }
        });
        request.end();
    }else{
        if(_.isFunction(param.oncomplete)){
            param.oncomplete({meta:{code:-403, msg:'Not Login'}});
        }

        if(_.isFunction(param.onerror)){
            param.onerror({meta:{code:-403, msg:'Not Login'}});
        }
    }
}

