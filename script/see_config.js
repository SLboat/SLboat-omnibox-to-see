var link_for_token = "http://www.flickr.com/auth-72157633098872233"; //API KEY的对应获取地址

function init() {
	//可以工作
	Load_Setting()
}

//载入设置
function Load_Setting(){
	// th1nk: 利用遍历一次性保存-听起来如何，匹配ID来操作，这样可以直接读取改变的值来变更哪里变了，不用全局变动

    $("#font_type").val(localStorage.font_type || "none"); //默认不开启

	//种子不用动

	Disabled_Save_Button();
}

//保存设置
function Save_Setting() {
	localStorage.clear(); //清空抛弃不必要的
	localStorage.font_type = $("#font_type").val();

	Disabled_Save_Button();	//黑按钮
	save_tips("应该保存进去了！不然为啥按钮都黑了！");	//保存提醒

   // chrome.extension.getBackgroundPage().init();
}

//开启按钮
function Enable_Save_Button() {
   $("#save-button").prop("disabled",false);
   tips("我已经记下了你的字体！");
}

//禁止按钮
function Disabled_Save_Button() {
   $("#save-button").prop("disabled",true);
}

$(document).ready(function(){
	init(); //载入默认

	$("input").bind("input",Enable_Save_Button); //所有输入框
	$("select").bind("change",Enable_Save_Button); //所有选择框
	$("#save-button").click(Save_Setting); //所有保存

})

//直接输入提示给token
function tips(text){
		$("#tips").text(text); //不返回直接操作
}

function save_tips(text){
	$("#save_info").text(text); //传入内容
	$("#save_info").show();
	$("#save_info").fadeOut(5000);

}

// 生成min-max之间的随机数整数
function random_int(min,max){
	return parseInt(Math.random()*(min-max)+max)
}
