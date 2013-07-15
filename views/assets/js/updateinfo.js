$(function(){
	$("#update-btn").on("click", function(ev){
		ev.preventDefault();
		$(this).addClass("disable");
		$("#logbox").show();
		window.onbeforeunload = function(){
			return "venus正在更新不能关闭窗口。"
		}
		var btn = this, updateTimer, restartOkTimer;
		function T(){
			$.get("/startupdate?t=" + (new Date().getTime()), function(data){
				if(!updateTimer) return;
				clearInterval(updateTimer);
				updateTimer = null;
				if(data.errCode == 0){
					function getUpdateLog(){
						$.get("/getupdatelog?t=" + (new Date().getTime()), function(data){
							var trans = {
								"start" 		: "开始更新",
								"download"		: "开始下载",
								"downloading"	: "正在下载",
								"downloaded"	: "下载完成",
								"extract"		: "开始解压",
								"extracted"		: "解压完成",
								"update"		: "开始升级",
								"updated"		: "升级完成",
								"fatal"			: "更新失败",
								"bakup"			: "开始备份",
								"bakuped"		: "备份成功",
								"restart"		: "正在重启"
							};
							var res = [], ended = false;
							function createTpl(data){
								var tpl = '<div class="clearfix item #0#"><label>#1#</label><div class="con">#2#</div></div>';
								$(data).each(function(i, v){
									tpl = tpl.replace(new RegExp("#" +i+ "#"), v);
								});
								return tpl;
							}
							$(data).each(function(i, d){
								for(var k in d){
									var cls = "note", tk = k;
									if(k == "fatal"){
										cls = "fatal";
									}
									if(k == "downloading"){
										if(data[i+1] && data[i+1]['downloading']){
											return;
										}
									}
									if(k == "downloading"){
										d[k] = "<div class='downloading'><div class='i' style='width:"+d[k]+"'></div></div>"
									}
									if(k == "restart"){
										ended = 1;
									}
									if(k == 'fatal'){
										ended = 2;
									}
									if(trans[k]){
										k = trans[k];
									}
									res.push(createTpl([cls, k, d[tk]]));
								}
							});
							if(ended){
								$(btn).removeClass("disable");
								clearInterval(updateTimer);
								window.onbeforeunload = null;
								//更新完成，启动重启完成检测
								if(ended == 1){
									setTimeout(function(){
										restartOkTimer = setInterval(function(){
											$.get("/login", function(){
												if(!restartOkTimer) return;
												//重启完成
												clearInterval(restartOkTimer);
												restartOkTimer = null;
												$(createTpl(['fatal', '重启完成', '5秒钟后打开venus...'])).appendTo("#logbox .log");
												setTimeout(function(){
													window.location.reload();
												}, 5000);
											});
										}, 100);
									}, 3000);
								}
							}else{
								setTimeout(getUpdateLog, 100);
							}
							$("#logbox .log").html(res.join(""));
						});
					}
					getUpdateLog();
				}
			});
		}
		updateTimer = setInterval(T, 100);
	});
});