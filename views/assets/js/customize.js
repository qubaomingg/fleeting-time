$(function(){
	console.log(self.parent.window.__DD_PREVIEW_CUSTOMIZE_DATA);
	var _window = self.parent.window,
		frame = _window.document.getElementById('DD_PREVIEW_CUSTOMIZE'),
		opened = false;
	function run(cmd, quick){
		var _w, _h, offset, targ = $("#options-box"),
			onOk = function(){};

		if(cmd == "open"){
			targ.show();

			_w = targ.width(), _h = targ.height();
		}else{
			_w = 42, _h = 37;
			onOk = function(){
				targ.hide();
			}
		}
		if(!quick){
			$('.customize').animate({
				width: _w,
				height: _h
			}, {
				duration: 200,
			  	step: function(now, fx) {
			  		frame.style[fx.prop] = now + 2 + "px";
			  	},
			  	complete: function(){
			  		onOk();
			  	}
			});
		}else{
			$('.customize').css({
				width: _w,
				height: _h
			});
			$(frame).css({
				width: _w + 2,
				height: _h + 2
			});
			onOk();
		}
	}

	$(".customize").on("mouseenter mouseleave", function(ev){
		if($("#icon").hasClass("fix")){
			return;
		}
		if(ev.type == "mouseenter"){
			run("open");
		}else{
			run("close");
		}
	});
	if($.cookie("fix")){
		$("#icon").addClass("fix");
		run("open", true);
	}
	$("#icon").on("click", function(ev){
		$(this).toggleClass("fix");
		if($(this).hasClass("fix")){
			$.cookie("fix", "1", {expires: 10000});
		}else{
			$.cookie("fix", null);
		}
	});
});