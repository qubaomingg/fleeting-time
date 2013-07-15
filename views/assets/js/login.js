$(function(){
	function middle(){
		$(".login-holder").css({
			"margin-top":Math.max(($(window).height() - 330)/2, 0)
		});
	}
    $(window).on("resize", middle);
    middle();
    $("#login-submit").on("click", function(){
    	$("#login-form").submit();
    })
    $("#login-form").on("keypress", function(ev){
    	if(ev.keyCode == 13){
    		$("#login-form").submit();
    	}
    });
    if($("#errmsg").length != 0){
        var tip = new toollib.tip("#login-submit");
        tip.show($("#errmsg").html());
    }
})