$(function(){
    var toollib = {};
    $("input.placeholder").each(function(i, el){
        var value = $(el).attr("default");
        $(el).on("focus", function(){
            if($(this).attr("isPsw")){
                $(this).attr('type', "password");
            }
            $(this).parent().addClass("on");
            if($(this).val() == value){
                $(this).val("");
            }
        });
        $(el).on("blur", function(){
            if($(this).val() == ""){
                $(this).val(value);
                if($(this).attr("isPsw")){
                    $(this).attr('type', "text");
                }
            }
            $(this).parent().removeClass("on");
        });
        if($(el).val() === ""){
            $(el).val(value);
        }
    });
    var Dialog = function(el){
        var me = this;
        this.target = el;
        $(window).on("resize", function(){
            me.middle();
        });
    }
    Dialog.prototype = {
        mask: "dialog-mask", showing: false,
        middle: function(force){
            if(!this.showing && !force) return;
            var toTop = Math.max($(window).height() -
                              $(this.target).height())/2;
            if(!this.showing){
                $(this.target).css({
                    top: -($(this.target).height()),
                    opacity:0,
                    left:Math.max($(window).width() -
                                  $(this.target).width())/2
                });
                $(this.target).animate({
                    top: toTop,
                    opacity:1
                }, 200);
            }else{
                $(this.target).css({
                    top: toTop
                });
            }
            $(this.mask).css({
                height: $(document).height()
            });
        },
        update: function(){
            this.middle(true);
        },
        createMask: function(){
            var me = this;
            if($("#"+me.mask).length == 0){
                $("<div id='"+me.mask+"'></div>").css({
                    width   :"100%",
                    height  :$(document).height(),
                    position:"absolute",
                    top     :"0",
                    left    :"0",
                    background:'#3c4e5b',
                    zIndex  :"65535",
                    opacity :"0.8",
                    display :"none"
                }).appendTo($('body .wrapper'));
            }
            me.mask = "#" + me.mask;
            $(me.mask).on("click", function(){
                me.hide();
            });
        },
        show: function(){
            if($(this.mask).length == 0){
                this.createMask();
            }
            $(this.mask).fadeIn('fast');
            $('body, html').css({
                overflow: "hidden"
            });
            $(this.target).css({
                zIndex: 65536
            }).show();
            this.middle(true);
            this.showing = true;
        },
        showMsg: function(msg){
            var div = $(".dialog-errmsg", this.target);
            if(!div) return;
            $(".msg", div).html(msg);
            div.show().css({
                top: -36
            }).animate({
                top: 0
            }, 100);
            clearTimeout(this.timer);
            this.timer = setTimeout(function(){
                div.animate({top: -36}, 100);
            }, 3000);
        },
        hide: function(){
            this.showing = false;
            $(this.mask).fadeOut('fast');
            $(this.target).fadeOut('fast');
            $('body, html').css({
                overflow: "auto"
            });
        }
    };
    var tooltip = function(ele){
        this.target = $(ele);
    }
    tooltip.getUid = function(){
        tooltip.id = tooltip.id || 0;
        return tooltip.id++;
    }
    tooltip.prototype = {
        show: function(msg, time){
            var id = "_tip" + tooltip.getUid();
            $("<div class='tip' id='"+id+"' style='float:left;'>"+
                "<div class='arrow'></div>"+
                "<div class='text'>"+msg+"</div>"+
              "</div>").appendTo($('body'));
            var offset = $(this.target).offset()
                width  = $("#" + id).width(), me = this;
            $("#" + id).css({
                position: "absolute",
                top     : offset.top,
                width   : width,
                zIndex  : 65536
            });
            $("#" + id).css({
                left    : offset.left - width - 10
            });
            setTimeout(function(){
                me.hide();
            }, time||5000);
            this.id = "#" + id;
        },
        hide: function(){
            if($(this.id)){
                $(this.id).remove();
            }
        }
    };

    function initSelectUI(selectUI, top){
        var selectUIHolder = selectUI.parent();
        //初始化scroller
        var scroller = $(".scroller", selectUIHolder);
        scroller.tinyscrollbar();
        selectUI.on("beforeopen", function(){
            $(scroller).css({
                "top" : top? -192 : $("h4", selectUIHolder).outerHeight(),
                "width" : $("h4", selectUIHolder).outerWidth() - 2
            });
            $(scroller).show();
        });
        selectUI.on("afteropen", function(){
            var toH = $(".overview", scroller).height();
            $(".viewport", scroller).css({
                "height" : Math.min(toH, 200)
            });
            scroller.tinyscrollbar_update();
        });
        selectUI.on("afterclose", function(){
            $(scroller).hide();
        });
    }

    toollib.Dialog = Dialog;
    toollib.tip    = tooltip;
    window.toollib = toollib;
    window.initSelectUI = initSelectUI;
})