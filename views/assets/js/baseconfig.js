$(function(){
	var step1 = $('#config-step1'),
		step2 = $('#config-step2'),
		step3 = $('.wait-for-restart');

	if(step1.length > 0){
		initStep1();
	}

	if(step2.length > 0){
		initStep2();
	}

	if(step3.length > 0){
		initStep3();
	}

	function initStep1(){
		$('#workspace-submit').click(function(){
			$('#base-form').submit();
		})
	}

	function initStep2(){
		$("#all-submit").ajaxForm();
		$('#all-submit').click(function(){
			$('#base-form').submit();
		})
	}

	function initStep3(){
		var count = 5, timer;
		timer = setInterval(function(){
			count --;
			$("#time").html("(" + count + ")");
			if(count == 0){
				clearInterval(timer);
				$(".wait-for-restart").hide();
				$(".config-ok").show();
			}
		}, 1000);
	}
})