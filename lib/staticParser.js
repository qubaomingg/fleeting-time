fs = require('fs');
env = require('./setting');
path = require('path');
Theme = require('./theme');
htmlparser = require('htmlparser');
URL = require('url');

EXPS = [
	{exp: /url\(('|")?(.+?)\1\)/g, sourceGroup: 2, fileGroup: 2},
    {exp: /\{#image.*?\|\s*value\s*:\s*(['"])(.+)\1\s*\}/g, sourceGroup: 2, fileGroup: 2},
	{exp: /(\{\?theme\.root\}(.+)\{\/theme\.root\})/g, sourceGroup: 1, fileGroup: 2}
]

PROCESS_FILE_TYPE = [
	'.css',
	'.js'
]

function isLocalUrl(url){
	if(!!url && !/^http|^\{\$/.test(url)) return true;

	return false;
}

function encodeRegExp(str){
	return str.replace(/\$/g, '\\$')
				.replace(/\//g, '\\/')
				.replace(/\?/g, '\\?')
				.replace(/\./g, '\\.')
				.replace(/\}/g, '\\}')
				.replace(/\{/g, '\\{')
                .replace(/\+/g, '\\+');
}

function processUrl(url, surl, row, col, ret, theme, refer){

	if(!isLocalUrl(url) || !url) return;

	if(!ret) ret = [];

	var id = theme.getId(),
		dirname = path.dirname(refer),
		abspath = url, requesturl,
		httpurl = env.get('hosturl') + '/static-proxy/' + id;

	if(url.indexOf('/') != 0){
		dirname = dirname.replace(/^\//, "");
		abspath = path.join('/', dirname, url);
	}

    if(abspath == '/') return;
    
	abspath = abspath.replace(/\\/g, "/");

	ret.push({
		'source': surl,
		'spath': url,
		'abspath': abspath,
		'row': row,
		"col": col,
		'url': httpurl + abspath
	});
}

function parseHTML(data){
	var handler = new htmlparser.DefaultHandler();
	var parser = new htmlparser.Parser(handler);
	//预处理标签兼容性问题
	var regExp = /<([a-zA-Z][a-zA-Z0-9]*)([^\n>]+)?>/g,
		re = [];

	data.toString().split('\n').forEach(function(line){
	    	line = line.toString();
	    	line = line.replace(regExp, function(m, p1, p2){
	    		return "<" + p1 + " " + (p2||"") + ">";
	    	});
	    	re.push(line);
	    }
	);
	parser.parseComplete(re.join("\n"));

	return handler.dom;
}

function getLocalFileList(theme, file, notuniqed, source){
	if(typeof theme == "string"){
		theme = Theme.init(theme);
	}
    var pureSource = source;
    if(!source){
	    source     = theme.getFile(file);
        pureSource = theme.getFile(file, true);
    }
	if(source == -1){
		return -1;
	}
	var extname = path.extname(file).toLowerCase(),
		themePath = theme.getPath(),
		result = [], tags = [], tmpExp;

	if(extname == '.html'){
		var dom = parseHTML(pureSource);
		
		parseDom(dom);

		for(var i = 0; i < tags.length; i++){
			var tag = tags[i];

			if(tag.name == 'link'){
				var href = tag.attributes.href;

				processUrl(href, href, tag.location.line, tag.location.col, result, theme, file);
			}else if(tag.name == 'script' || tag.name == 'img'){
				try{
					var src = tag.attributes.src, type;
					if(!src) continue;
					if(tag.name == "script"){
						type = tag.attributes.type;
						if(type && type != 'text/javascript'){
							continue;
						}
					}

					processUrl(src, src, tag.location.line, tag.location.col, result, theme);
				}catch(ex){}
			}
		}

		for(var i = 0, match; i < EXPS.length; i++){
			tmpExp = new RegExp(EXPS[i]['exp']);
			while(match = tmpExp.exec(source)){
				//计算行号和列号
				var index = tmpExp.lastIndex - match[EXPS[i]['fileGroup']].length,
					subsource = source.substring(0, index),
					row = subsource.split("\n").length,
					col = subsource.split("\n").slice(-1)[0].length;

				processUrl(match[EXPS[i]['fileGroup']], match[EXPS[i]['sourceGroup']], row, col, result, theme, file);
			}
		}

	}else if(PROCESS_FILE_TYPE.indexOf(extname) > -1){
		for(var i = 0, match; i < EXPS.length; i++){
			tmpExp = new RegExp(EXPS[i]['exp']);
			while(match = tmpExp.exec(source)){
				//计算行号和列号
				var index = tmpExp.lastIndex - match[EXPS[i]['fileGroup']].length,
					subsource = source.substring(0, index),
					row = subsource.split("\n").length,
					col = subsource.split("\n").slice(-1)[0].length;

				processUrl(match[EXPS[i]['fileGroup']], match[EXPS[i]['sourceGroup']], row, col, result, theme, file);
			}
		}
	}

	function parseDom(dom){
		for(var i = 0; i < dom.length; i++){
			if(typeof dom[i].name != 'string') continue;
			if(dom[i].name.match(/[^a-zA-Z]/)) continue;
			tags.push(dom[i]);
			if(!!dom[i].children){
				parseDom(dom[i].children);
			}
		}
	}

    function uniq(ret){
        var result = [], flag = {}, i = 0, item;

        for( ; i < ret.length; i++){
            item = ret[i];

            if(!!flag[item.source]) continue;

            result.push(item);

            flag[item.source] = true;
        }

        return result;
    }

	return notuniqed ? result : uniq(result);
}

function replaceLocalFile(theme, file){
	var theme = Theme.init(theme),
		source = theme.getFile(file),
		list = getLocalFileList(theme.getId(), file);

	for(var i =0; i < list.length; i++){
        if(theme.hasFile(list[i].abspath)){
		    var reg = new RegExp(encodeRegExp(list[i].source), 'g');
		    source = source.replace(reg, list[i].url);
        }
	}

    if(source && source.replace){
	    source = source.replace(/(\{\?theme\.root\}|\{\/theme\.root\})/g, '');
    }

	return source;
}

exports.getLocalFileList = getLocalFileList;
exports.replaceLocalFile = replaceLocalFile;
