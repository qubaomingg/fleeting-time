$(function(){
    $(".tool-dialog select").each(function(i, select){
        initSelectUI($(select).sSelect());
    });
    var publishSelectUI = $("#publish").sSelect();
    publishSelectUI.on('beforeopen', function(){
        logCloseHandler();
    });
    initSelectUI(publishSelectUI, true);

    $(".tpl-info").each(function(i,item){
    	$(item).on("click", function(ev){
    		$(".tpl-info-tip", $(item).parent()).fadeToggle();
    		$(this).toggleClass("on");
    		ev.preventDefault();
    	});
    });
    if($("#updateInfo").length != 0){
        setTimeout(
            function(){
                $("#updateInfo").show().animate({
                    bottom: 0
                }, 300);
            },
            2000
        );
    }
    //初始化dialog
    var newTplDialog = new toollib.Dialog("#new-tpl-dialog");
    $("#new-tpl").on("click", function(ev){
        $("#new-tpl-form")[0].reset();
        newTplDialog.show();
        ev.preventDefault();
    });
    $("#new-tpl-dialog-close").on("click", function(ev){
        newTplDialog.hide();
        ev.preventDefault();
    })
    //初始化设置dialog
    var settingDialog = new toollib.Dialog("#setting-dialog");
    $("#blog-setting").on("click", function(ev){
        settingDialog.show();
        ev.preventDefault();
    });
    $("#setting-dialog-close").on("click", function(ev){
        settingDialog.hide();
        ev.preventDefault();
    });
    //初始化tab切换
    $("#setting-dialog .tab li").each(function(i, li){
        $(li).on("click", function(ev){
            $("li", this.parentNode).each(function(j, _li){
                $(_li).removeClass("on prev");
                $($.attr(_li, "target")).hide();
            });
            $(this).addClass("on");
            $(this).prev().addClass("prev");
            $($.attr(this, "target")).show();
            settingDialog.update();
        });
    });
    //第一次是否需要设置工作目录
    if($("#resetWorkspace").length != 0){
        settingDialog.show();
        settingDialog.showMsg("模板工作目录不合法，请重新设置");
    }
    /*实时编辑模板名称和描述*/
    var ContentEditable = function(el, type, onblur){
    	type = type || "input";
    	this.type = type;
    	this.target = $(el);
    	this.onblur = onblur || function(){};
    	this.init();
    }
    ContentEditable.prototype = {
    	tpls: {
    		"input" : "<input type='text' name='{name}' id='{id}'/>",
    		"textarea" : "<textarea name='{name}' id='{id}'></textarea>"
    	},
    	_guid: function(){
    		arguments.callee.id = arguments.callee.id || 0;

    		return arguments.callee.id++;
    	},
    	_format: function(tpl, obj){
    		return tpl.replace(/\{([^\}]+)\}/g, function(j,k){
    			return obj[k] || (obj[k] === 0 ? 0 : "");
    		})
    	},
	    init: function() {
	    	var me = this;
    		me.target.on("click", function(){
    			me.render();
    		});
    	},

    	render: function(){
    		if(this.target.data().editing) return;
    		var value 	= this.target.html(),
    			height 	= this.target.height(),
    			width	= this.target.width(),
    			uid 	= "EDITABLE_" + this._guid(),
    			me		= this;
            this.origVal = value;
    		this.target.html(this._format(
    			this.tpls[this.type],
    			{
    				name: uid,
    				id	: uid
    			}
    		));
    		this.target.data({editing: true});
            $("#" + uid).val(value.replace(/<br\s*\/?>/g, "\n"));
    		$("#" + uid).css({
    			border	:"0 none",
    			margin	:"0",
    			padding	:"0",
    			background:"none",
    			height	:height,
    			width	:width,
    			outline	:"none",
                display :"block"
    		});
            if(this.type == "textarea"){
                $("#" + uid).autoResize({
                    // Quite slow animation:
                    animateDuration : 300,
                    // More extra space:
                    extraSpace : 40
                });
            }
    		$("#" + uid).on("blur", function(){
    			var val = $(this).val()
    					  .replace(/</g, "&lt;")
    					  .replace(/>/g, "&gt;")
    					  .replace(/\n/g, "<br/>");
    			me.onblur(val, me.origVal);
    			me.target.data({editing: false});
    		})
    		$("#" + uid).focus();
    	}
    };
    $(".tpl-name").each(function(i,item){
	    new ContentEditable(item, "input", function(val, orgin){
	    	var url = $(item).attr("url");
            $.post("/theme/change/name", 
                   {url: url, val: val}, function(data){
                var data = JSON.parse(data);
                if(data.errCode == 0){
                    $(item).html(val);
                }else{
                    $(item).html(orgin);
                }
            });
	    });
    });
    $(".tpl-info-text").each(function(i,item){
	    new ContentEditable(item, "textarea", function(val, orgin){
	    	var url = $(item).attr("url");
            $.post("/theme/change/description", 
                   {url: url, val: val}, function(data){
                var data = JSON.parse(data);
                if(data.errCode == 0){
                    $(item).html(val);
                }else{
                    $(item).html(orgin);
                }
            });
	    });
    });

    $("#new-tpl-form").ajaxForm();
    $("#new-submit").on("click", function(ev){
        $("#new-tpl-form").attr("action", "/theme");
        $("#new-tpl-form").ajaxSubmit(function(data){
            var data = $.parseJSON(data);
            if(data.errCode == 0){
                window.location.reload();
            }else{
                newTplDialog.showMsg(data.errMsg);
            }
        });
        ev.preventDefault();
    });
    $("#new-save-as").on("click", function(ev){
        $("#new-tpl-form").attr("action", "/theme/saveas/default");
        $("#new-tpl-form").ajaxSubmit(function(data){
            var data = $.parseJSON(data);
            if(data.errCode == 0){
                newTplDialog.showMsg("保存为常用配置成功");
            }else{
                newTplDialog.showMsg(data.errMsg);
            }
        });
        ev.preventDefault();
    });
    $("#setting-form").ajaxForm();
    $("#setting-submit").on("click", function(ev){
        $("#setting-form").ajaxSubmit(function(data){
            data = $.parseJSON(data);
            var tip = new toollib.tip("#setting-submit");
            if(data.errCode == 0){
                var msg = "设置成功";
                if(data.forceReload){
                    msg += "，请等待页面自动刷新";
                    setTimeout(function(){
                        window.location.reload();
                    }, 2000);
                }
                settingDialog.showMsg(msg);
            }else if(data.errCode == -1){
                settingDialog.showMsg(data.errMsg);

                setTimeout(function(){
                    location.href = "http://" + data.location;
                }, 3000)
            }else{
                settingDialog.showMsg(data.errMsg);
            }
        });
        ev.preventDefault();
    })
    $("#tpl-s-new").on("click", function(ev){
        $.post("/theme/quickcreate", function(data){
            window.location.reload();
        });
        ev.preventDefault();
    });
    var checkedTheme, logHolderInted;
    $("#publish").change(function(){
        logCloseHandler();
    });
    $("#publish-btn").on("click", function(ev){
        var id = $("#publish").val(), me = this;
        ev.preventDefault();
        if($(this).hasClass("disable")){
            return;
        }
        if(checkedTheme != id){
            alert("你必须先进行代码检测才能够发布");
        }else{
            //发布逻辑
            $("#log").fadeOut("fast");
            $.post("/theme/publish/"+id, function(data){
                var data = $.parseJSON(data);
                if(data.errCode == 0){
                    //锁定发布按钮
                    $(me).addClass("disable");
                    //启动轮询获取文件发布状态
                    var mask = $("<div></div>").css({
                        "position":"absolute",
                        "top":0,
                        "left":0,
                        "z-index":65531,
                        "opacity":0,
                        "background":"#fff",
                        "height":$(document).height(),
                        "width":"100%"
                    }).appendTo(".wrapper-i").animate({
                        "opacity":0.3
                    }, 500);
                    function T(){
                        $.post("/theme/publish/log/"+id, function(logs){
                            logs = $.parseJSON(logs);
                            if(logs.errCode == 0){
                                var html = [], trans = {
                                    "compressing" : ["notice", "正在压缩 {0}"],
                                    "uploading":["notice", "正在上传 {0}"],
                                    "uploaded" :["notice", "{0} 上传完成"],
                                    "replacing":["notice", "正在替换 {0}"],
                                    "replaced" :["notice", "{0} 替换完成"],
                                    "success"  :["hightlight", "静态文件上传成功"],
                                    "publishing":["notice", "正在发布模板 {0}"],
                                    "publishok":["hightlight", "模板 {0} 发布成功 {1}"],
                                    "publishfail":["fatal", "模板 {0} 提交失败，原因是：{1}"]
                                }, success = 0, fail = 0;
                                $(logs.data).each(function(i, d){
                                    for(var k in d){
                                        var obj = {}, re = trans[k];
                                        if(k == "publishok"){
                                            success = 1;
                                            fail = 0;
                                        }
                                        if(k == "publishfail" || k == "fatal"){
                                            success = 0;
                                            fail = 1;
                                        }
                                        if(re){
                                            var _re = d[k].toString().split("@");
                                            if(_re[1] && _re.length > 2){
                                                _re[1] = _re.slice(1).join("@");
                                                _re = _re.splice(0,2);
                                            }
                                            obj[re[0]] = re[1].replace(/\{(\d+)\}/g, function(k,j){
                                                return _re[j]||"";
                                            });
                                        }else{
                                            obj[k] = d[k];
                                        }
                                        html.push(createTpl(obj));
                                    }
                                });
                                $("#logs-holder").html(html.join(""));
                                updateScroller();
                                if(success == 0 && fail == 0){
                                    setTimeout(function(){
                                        T();
                                    }, 100);
                                }else{
                                    $(mask).remove();
                                    $(me).removeClass("disable");
                                    if(success){
                                        $("#"+id+" .tpl-status-mask").show();
                                    }
                                }
                            }else{
                                $(mask).remove();
                                $("#logs-holder").html(logs.errMsg);
                                $('#log .log-note').hide();
                                logHolder.tinyscrollbar_update();
                                $(me).removeClass("disable");
                            }
                        });
                    }
                    $("#logs-holder").html("");
                    $('#log .log-note').hide();
                    $('#log').css({"right":40}).show();
                    setTimeout(T, 500);
                }else{
                    var html = [];
                    $(data.logs).each(function(i,log){
                        var obj = {
                            "fatal":"检测调用了不存在的文件:"+log[1]
                        };
                        html.push(createTpl(obj));
                    });
                    $("#logs-holder").html(html.join(""));
                    $('#log .log-note').hide();
                    $('#log').show();
                    logHolder.tinyscrollbar_update();
                }
                $("#publish-btn .btn-text").html("发布");
            });
        }
    });
    function logCloseHandler(){
        $('#log').fadeOut("fast");
        checkedTheme = null;
        $("#publish-btn").addClass("disable");
    }
    function createTpl(data){
        var _html = [], trans = {
            "fatal":"严重",
            "warn":"警告",
            "notice":"提示",
            "hightlight":"提示"
        };
        function T(obj){
            return '<div class="log-detail"><div class="'+obj.k+'">'+
                    '<span class="log-tip">'+obj.tip+
                    '： </span><span>'+obj.v+'</span></div></div>'
        }
        for(var k in data){
            _html.push(T({k: k,v: data[k],tip: trans[k]}));
        }
        return _html.join("");
    }

    var logHolder = $("#log");
    logHolder.tinyscrollbar();
    function updateScroller(top){
        var _top = (top || top == 0) ? top : 
                   Math.max(0, $("#logs-holder").height()-$("#log .viewport").height());
        logHolder.tinyscrollbar_update(_top);
    }

    $("#check-btn").on("click", function(ev){
        var id = $("#publish").val(), me = this;
        $.post("/theme/check/"+id, function(data){
            var data = $.parseJSON(data), html = [];
            if(data.errCode == 0){
                checkedTheme = id;
                for(var k in data.result){
                    html.push("<div class='log-title'>已检测文件："+k+"</div>");
                    $(data.result[k]).each(function(j, _item){
                        html.push(createTpl(_item));
                    });
                }
                $('#logs-holder').html(html.join(""));
                $('#log .log-note').show();
                $('#log').css({"right":135}).show();
                updateScroller(0);
                $('#log .log-close').one("click", function(ev){
                    logCloseHandler();
                    ev.preventDefault();
                });
                $('#publish-btn').removeClass("disable");
            }else{
                alert(data.errMsg||"代码检测失败，请重新检测");
            }
        });
        ev.preventDefault();
    });
})