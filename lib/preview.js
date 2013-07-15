var express = require('express');
var api = require('../api');
var theme = require('./theme');
var setting = env = require('./setting');
var path = require('path');
var staticParser = require('./staticParser');
var mime = require('./mime');

function getMime(filename){
    var ext = path.extname(filename).replace('.', '');

    if(!!ext && !!mime[ext]) return mime[ext];

    return 'text/plain';
}

exports.init = function(data){
	var res = data.res;
	var themeId = data.theme,
		blogId  = data.blogId;

	api.getBlogList({
        "personalOnly" : data.isAdvPreview,
		"oncomplete": function(data){
			res.render('preview', {
				blogs:data,
				blogId:setting.get('defaultPreviewBlogId'),
				hostname:env.get('hosturl')
			});
		}
	});
}

exports.customize = function(data){
	var res = data.res;

	res.render('customize');
}

exports.render = function(data){
    var res = data.res;

    var t = theme.init(data.theme);

    if(!t.folder){
        res.send("");
        return;
    }

    var html = staticParser.replaceLocalFile(data.theme, t.index);

    api.preview({
        template:html,
        blogId: data.blogId,
        uri: data.url,
        localInfo: {
            blogProxyUrl:env.get('hosturl') + '/preview/' + data.theme + '/' + data.blogId,
            wwwProxyUrl:env.get('hosturl')
        },

        onsuccess:function(r){
            var html = r.result.html;
            html = html + "<iframe scrolling='no' id='DD_PREVIEW_BLOGS_LIST' style='position:fixed;bottom:50px;right:50px;width:44px;height:44px;z-index:65537;' allowTransparency='true' frameborder='0' src='/blogs/"+data.theme+"/"+data.blogId+"'></iframe>";

            res.send(html);
        },

        onerror:function(r){
            res.send(r.meta.msg);
        }
    });
}

exports.renderAdv = function(data){
	var res = data.res;

	var t = theme.init(data.theme);

    if(!t.folder){
        res.send("");
        return;
    }

	var html = staticParser.replaceLocalFile(data.theme, t.index);
    api.getBlogList({
        "oncomplete": function(blogList){
            var blogUrl;
            for(var i= 0,l=blogList.length;i<l;i++){
                if(blogList[i].id == data.blogId){
                    blogUrl = blogList[i].blog_url;
                    break;
                }
            }
            api.previewAdv({
                template:html,
                blogId: data.blogId,
                uri: data.url,
                blogUrl: blogUrl,
                theme : data.theme,
                localInfo: {
                    blogProxyUrl:env.get('hosturl') + '/preview/' + data.theme + '/' + data.blogId,
                    wwwProxyUrl:env.get('hosturl')
                },

                onsuccess:function(html){
                    html = html + "<iframe scrolling='no' id='DD_PREVIEW_BLOGS_LIST' style='position:fixed;bottom:50px;right:50px;width:44px;height:44px;z-index:65537;' allowTransparency='true' frameborder='0' src='/blogs/"+data.theme+"/"+data.blogId+"?isadv=1'></iframe>";
                    res.send(html);
                },

                onerror:function(r){
                    res.send(r);
                }
            });
        }
    });
}

exports.serverStatic = function(data){
	var res = data.res;

	try{
		var source = staticParser.replaceLocalFile(data.theme, data.url),
            type = getMime(data.url);

        res.header("Content-Type", type);
		res.send(source);
	}catch(ex){
		res.writeHead(404);
		res.end();
	}
}

