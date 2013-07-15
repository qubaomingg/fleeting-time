$(function(){
	String.prototype.trim = function() {
     return this.replace(/^[\s\u3000\xA0]+|[\s\u3000\xA0]+$/g,"");  
	}

	var isSeekFilm,isSeekPic,isSeekMusic,isSeekAlink,isSeekArticle,containMinHeight;
	resetIsSeek();
	//布尔值，判断是在查看什么类型，支持滚动条自适应。
	function resetIsSeek(){
		isSeekPic = false;
	    isSeekMusic = false;
	    isSeekFilm = false;
	    isSeekAlink = false;
	    isSeekArticle = false;
	}
	//动态生成展示的图片。
	var photo_detail = $('<div id="photo-detail"></div>');
    $('#contain').append(photo_detail);
    var photolen = photoSrc.length;
	for(var i = 0;i<photolen;i++){
   		$('<div class="eachImg"></div>').appendTo(photo_detail);  //加一层div，防止图太短，两张图片在同一行。
        $('<img></img>').attr('src',photoSrc[i]).appendTo($('.eachImg').eq(i));
    }
    //=====Start 判断是否主要的五个为空,在canvas之前。=========
	if($('.alink').html().trim() == ''){
		$('<p class="post link">还没有文章哦，快去写点吧！~</p>').appendTo($('.alink'));
		$('<p class="post link">还没有article哦，快去首页写点吧！~</p>').appendTo($('#link-detail'));
	}
	if($('.texts').html().trim() == ''){
		$('<p class="post link">还没有链接哦，快去写点吧！~</p>').appendTo($('.texts'));
		$('<p class="post link">还没有link哦，快去首页写点吧！~</p>').appendTo($('#texts-detail'));
	}
	if($('.photo-outer').html().trim() == ''){
		$('<div class="post photo" style="display:none"><a href=""><img src="http://www.baidupcs.com/thumbnail/nulltext.png?fid=2216614713-250528-4282442596&time=1354783539&sign=FPDTAE-DCb740ccc5511e5e8fedcff06b081203-jMLWNONTTUo6VLNlE1A%2Bn8tS4H8%3D&expires=8h&digest=17d3c207c169c22f3260f7fb9d76c2c9&size=c850_u580&quality=100"></a></div>').appendTo($('.photo-outer'));
		$('<p class="post link">还没有photo哦，快去首页写点吧！~</p>').appendTo($('#photo-detail'));
	}
	if($('.music').html().trim() == ''){
		$('<div class="post audio"><div class="cover"><img src="http://www.baidupcs.com/thumbnail/nullmusic.png?fid=2216614713-250528-4009052019&time=1354783539&sign=FPDTAE-DCb740ccc5511e5e8fedcff06b081203-GhpdA8DBz8L7DEQUgvL2cBJXqWk%3D&expires=8h&digest=008948121e6d57e31c20e36b70c9db95&size=c850_u580&quality=100"></div></div>').appendTo($('.music'));
		$('<p class="post link">还没有music哦，快去首页写点吧！~</p>').appendTo($('#music-detail'));
	}
	if($('.film').html().trim() == ''){
		$('<div class="post video"><div class="cover"><img src="http://www.baidupcs.com/thumbnail/nullvideo.png?fid=2216614713-250528-101158728&time=1354783539&sign=FPDTAE-DCb740ccc5511e5e8fedcff06b081203-XiBXIvboyAhsHz9UTqvtwmt0xcc%3D&expires=8h&digest=28f6c62f02d2d2f3ac2c52c983e25012&size=c850_u580&quality=100"></div></div>').appendTo($('.film'));
		$('<p class="post link">还没有film哦，快去首页写点吧！~</p>').appendTo($('#film-detail'));

	}
	//=====END 判断是否主要的五个为空=========

    //========Start点击了返回后==========
    $('#back').click(function(){
    	resetIsSeek();
	    $('#music-detail').fadeOut(3000);
	    $('#film-detail').fadeOut(3000);
	    $('#photo-detail').fadeOut(3000);
	    $('#link-detail').fadeOut(3000);
	    $('#texts-detail').fadeOut(3000);
	    $('#contain').animate({
	        height:'439px'
	    },2000,reBack);
	    $(this).fadeOut();
	    return false;
    });
    //五个向中间还原。
    function reBack(){
        $('#center-img').fadeIn().animate({
            top:'54px',
            opacity:'1',
            filter:'alpha(opacity=100)'
        },1000,function(){
            blast($('.photo'),false);
            blast($('.music'),true);
            blast($('.film'),true);
            blast($('.texts-outer'),false);
            blast($('.alink-outer'),false);
        });
    }
    //单个还原。
    function blast(obj,isLeft){
        if(isLeft){
            obj.show().animate({
                'left':(parseInt(obj.css('left')) - 100),
                'opacity':1,
                filter:'alpha(opacity=100)'
            },2000); 
        }else{
            obj.show().animate({
                'left':(parseInt(obj.css('left')) + 100),
                'opacity':1,
                filter:'alpha(opacity=100)'
            },2000); 
        }
    }
    //========End点击了返回后==========

    $('#top').click(function(){
        $('html,body').animate({
            scrollTop:0
        },1000);
    });
   
    //======开始动画==========
	$('<hr class="hr">').appendTo($('#contain'));
	$('.hr').animate({
		'width':'995px'
	},1000,showText);
    function showText(){
		$(this).animate({
			left:'1000px'
		},500,function(){
			$('.center-text').fadeIn(550).fadeOut(1000).fadeIn(550,showcircle);
		});
	}
	function showcircle(){
		$('#center-img img').fadeIn('500').animate({
			'left':'0px'
			},{
				duration:1000,
				easing:'easeInOutExpo',
				complete:showcanvas1
			}
		);
	}
	function showcanvas1(){
		$('.music').fadeIn('slow',showcanvas2);
	}
	function showcanvas2(){
		$('.film').fadeIn('slow',showlink);
	}
	function showlink(){
		$('.alink-outer').fadeIn('slow',showarticle);
	}
	function showarticle(){
		$('.texts-outer').fadeIn('slow',showcanvas0);
	}
	function showcanvas0(){
		$('.photo').fadeIn('slow');
	}
	//=========END动画结束。============
	
	//link和texts的hover事件。
	textAndlinkHover($('div.alink-outer'));
	textAndlinkHover($('div.texts-outer'));
	textAndlinkHover($('div.photo'));
	textAndlinkHover($('div.music'));
	textAndlinkHover($('div.film'));
	function textAndlinkHover(obj){
		obj.hover(function(){
			$(this).find('.hover-back-spe').fadeIn('slow');
		},function(){
			$(this).find('.hover-back-spe').fadeOut('slow');
		});
	}
	
	//=======响应滚动事件，动态加载。=====
    $(window).scroll(checkScrollPosition).scroll();
    // .scroll( handler(eventObject) ) a shortcut for .bind('scroll', handler) 
    //.scroll() .trigger('scroll')
    function checkScrollPosition(){
        var imgsheight = parseInt($('#photo-detail').css('height'));
        var musicheight = parseInt($('#music-detail').css('height'));
        var filmheight = parseInt($('#film-detail').css('height'));
        var linkheight = parseInt($('#link-detail').css('height'));
        var textsheight = parseInt($('#texts-detail').css('height'));
        var containheight = parseInt($('#contain').css('height'));
        //隐藏和出现返回顶部按钮
        if($(window).scrollTop() >= 200){
            $('#top').show('slow').hover(function(){
            	$(this).css({'opacity':'1',filter:'alpha(opacity=100)'});
            },function(){
                $(this).css({'opacity':'0.6',filter:'alpha(opacity=100)'});
            });
        }else{
            $('#top').hide('slow');
         }
         //处理动态加载部分。
        var distance = $(window).scrollTop() + $(window).height();
        if ($('#wrap').height() <= distance) {//如果可以增加
        	if(isSeekPic){//如果是点击的图片
				if(imgsheight +100 >= containheight){//如果图片没有到最后
	                $('#contain').animate({
	                    height:parseInt($('#contain').css('height')) +100
	                },10);
	             }
			}else if(isSeekMusic){
				if(musicheight +100 >= containheight){//如果图片没有到最后
	                $('#contain').animate({
	                    height:parseInt($('#contain').css('height')) +100
	                },10);
	            }
			}else if(isSeekFilm){
				if(filmheight +100 >= containheight){//如果图片没有到最后
	                $('#contain').animate({
	                    height:parseInt($('#contain').css('height')) +100
	                },10);
	            }
			}else if(isSeekAlink){
				if(linkheight +100 >= containheight){//如果图片没有到最后
	                $('#contain').animate({
	                    height:parseInt($('#contain').css('height')) +100
	                },10);
	            }
			}else if(isSeekArticle){
				if(textsheight +100 >= containheight){//如果图片没有到最后
	                $('#contain').animate({
	                    height:parseInt($('#contain').css('height')) +100
	                },10);
	            }
			}
            
        }
    }
   	//=======END响应滚动事件，动态加载=====

	//======Start五个主要的点击事件=========
	$('.photo a').click(function(){
		return false;
	});
	$('div.alink-outer').click(function(){
		isSeekAlink = true;
		fadeAll();
		$('#link-detail').delay(1000).fadeIn(3000);
		$('#back').delay(2000).fadeIn('slow');
	});
	$('div.texts-outer').click(function(){
		isSeekArticle = true;
		fadeAll();
		$('#texts-detail').delay(1000).fadeIn(3000);
		$('#back').delay(2000).fadeIn('slow');
	});
	$('.photo').click(function(){
		isSeekPic = true;
		fadeAll();
		$('#photo-detail').delay(1000).fadeIn(3000);
		$('#back').delay(2000).fadeIn('slow');
	});
	$('.music').click(function(){
		isSeekMusic = true;
		fadeAll();
		$('#music-detail').delay(1000).fadeIn(3000);
		$('#back').delay(2000).fadeIn('slow');
	});
	$('.film').click(function(){
		isSeekFilm = true;
		fadeAll();
		$('#film-detail').delay(1000).fadeIn(3000);
		$('#back').delay(2000).fadeIn('slow');
	});
	
	//全部向左右渐隐
	function fadeAll(){
		fadeobj($('.photo'),true);
		fadeobj($('.music'),false);
		fadeobj($('.film'),false);
		fadeobj($('.texts-outer'),true);
		fadeobj($('.alink-outer'),true);
		
		//这里为了引导contain高度达到最小高度，用的策略是contain高度达到屏幕高度的一半多一点。
		var firstAddId = setInterval(addonce,10);
		function addonce(){
			$('#contain').css('height',parseInt($("#contain").css('height')) +10 + 'px');
			if(parseInt($("#contain").css('height')) >= (document.documentElement.clientWidth/2 + 250)){
				clearInterval(firstAddId);
			}
		}
		$('#center-img').animate({
			'top':'184px',
			'opacity':0,
			filter:'alpha(opacity=0)'
		},2000,function(){
			$(this).hide();
		});
	}
	//单个向左右动
	function fadeobj(obj,isLeft){
			if(isLeft){
				obj.animate({
					'left':(parseInt(obj.css('left')) - 100),
					'opacity':0,
					filter:'alpha(opacity=0)'
				},500,function(){
					obj.hide();
				});	
			}else{
				obj.animate({
					'left':(parseInt(obj.css('left')) + 100),
					'opacity':0,
					filter:'alpha(opacity=0)'
				},500,function(){
					obj.hide();
				});	
			}
			
		}
	//=====END五个主要的点击事件=========
	//=====Start更换背景=========
	var defaultBg = $('body').css('background');
	var goHide = false;//是否隐藏
	$('.changeBg').click(function changeBgClick(){
		if(goHide){
			$('.outerHide').animate({
				left:'-352px'
			},{duration:1000,easing:'easeInQuint'});
			goHide = false;
			if(defaultBg != $('body').css('background')){
				$('body').css('background',defaultBg);
			}
		}else{
			$('.outerHide').animate({
				left:'0px'
			},{duration:1000,easing:'easeInOutQuint'});
			goHide = true;
		}
		return false;
	});
	$('.sigle img').click(function(){
		$('body').css('background','url('+$(this).attr("src")+') no-repeat fixed');
	});
	$('.hidebutton').eq(1).click(function(){
		$('body').css('background','url("../img/baseketball/6.jpg") no-repeat fixed');
	});
	$('.hidebutton').eq(0).click(function(){
		defaultBg = $('body').css('background');
		$('.changeBg').click();
	});
	$('.hideMid input').click(function(){
		var num = $(this).index();
		console.log(num);
		$('.hideBgchild').hide();
		$('.hideBgchild').eq(num).show();
	});
	//=====END更换背景=========
	
})