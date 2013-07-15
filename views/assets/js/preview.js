$(function(){
	var _window = self.parent.window,
		blogId = window.location.href.match(/blogs\/(.+)$/),
		frame = _window.document.getElementById('DD_PREVIEW_BLOGS_LIST'),
		opened = false;
	if(blogId){
		blogId = blogId[1].split('/');
		$("#blog-selector").val(blogId[1]);
	}
	var blogSelectUI = $("#blog-selector").sSelect();
	blogSelectUI.on('beforeopen', function(){
		opened = true;
	}).on('afterclose', function(){
		opened = false;
	});
	initSelectUI(blogSelectUI, true);
	$('iframe').height($(window).height() - $('#nav').height());

	$('#blog-selector').change(function(ev){
		var src = _window.location.href;

		src = src.split('/');

		src[4] = blogId[0];
		src[5] = $('#blog-selector').val();

		_window.location.href = src.slice(0,6).join('/') + "/";
	});
	function comoboxSlider(type){
		if(opened) return;
		var _w = 44;
		if(type == "show"){
			_w = 202;
		}else{
			$('.combobox h4').css({
				"text-indent":"-9999px"
			});
		}
		$('.combobox').animate({
			width: _w
		}, {
			duration: 200,
		  	step: function(now, fx) {
		  		frame.style.width = fx.now+"px";
		  	},
		  	complete: function(){
		  		if(type == "show"){
		  			$('h4', this).css({
		  				"text-indent":"0px"
		  			});
		  		}else{
		  			$('h4', this).css({
		  				"text-indent":"-9999px"
		  			});
		  		}
		  	}
		});
	}
	$('.combobox').on('mouseenter mouseleave', function(ev){
		comoboxSlider(ev.type=='mouseenter'?"show":"hide");
	});
	var _h = 0;
	setInterval(function(){
		var _h1 = $('.combobox ul').height();
		if(_h1 != _h){
			frame.style.height = _h1 + 44 + "px";
			_h = _h1;
			if(_h == 0){
				comoboxSlider("hide");
			}
 		}
	}, 100);
})