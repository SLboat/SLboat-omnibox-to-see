function init() {
	//可以工作
	Load_Setting()
}

//载入设置

function Load_Setting() {
	// th1nk: 利用遍历一次性保存-听起来如何，匹配ID来操作，这样可以直接读取改变的值来变更哪里变了，不用全局变动

	$("#font_type").val(localStorage.font_type || "none"); //默认不开启

	//种子不用动

	Disabled_Save_Button();
}

//保存设置

function Save_Setting() {
	localStorage.clear(); //清空抛弃不必要的
	localStorage.font_type = $("#font_type").val();

	Disabled_Save_Button(); //黑按钮
	save_tips("应该保存进去了！不然为啥按钮都黑了！"); //保存提醒

	// chrome.extension.getBackgroundPage().init();
}

//开启按钮

function Enable_Save_Button() {
	$("#save-button").prop("disabled", false);
	tips("我已经记下了你的字体！");
}

//禁止按钮

function Disabled_Save_Button() {
	$("#save-button").prop("disabled", true);
}

/* 初始化的时候处理... */
$(function() {
	init(); //载入默认

	$("input").bind("input", Enable_Save_Button); //所有输入框
	$("select").bind("change", Enable_Save_Button); //所有选择框
	$("#save-button").click(Save_Setting); //所有保存
	chorme_stroge_state();
})

/* 显示chrome存储的状态 */
function chorme_stroge_state() {
	chrome.storage.local.getBytesInUse(function(many) {
		var var_str = printf("%s (大概是%s)", [many, p100(many / 5242880, 2)])
		$("#chrome_save_amount").text(var_str); //写入值...
	});
}

//直接输入提示给token

function tips(text) {
	$("#tips").text(text); //不返回直接操作
}

function save_tips(text) {
	$("#save_info").text(text); //传入内容
	$("#save_info").show();
	$("#save_info").fadeOut(5000);

}

/* 转换百分数,传入小树,位数 */
function p100(number, fixed) {
	fixed = fixed || 0;
	return (number * 100).toFixed(fixed) + "%";
};

// 生成min-max之间的随机数整数

function random_int(min, max) {
	return parseInt(Math.random() * (min - max) + max)
}


/* 这是改变自Lupin所制造的一种打印字符
 * 这样使用它，str为原始串(%s代表标记),subs为一个匹配数组
 * 如果是单项，不需要数组，这里会转换
 * 如果多项，必须数组，否则只转换第一项
 * 实现部分，前者是字符串，使用%s作为匹配，后者是匹配组们
 * 一个使用就像是：printf("hello%s,why %s is here",["you","me"])
 * todo，增加五个附加值，避免每次要数组，事实上需要的参数并不太多
 */

function printf(str, subs) {
	if (typeof subs != typeof[]) {
		subs = [subs];
	} //非常有趣的转录
	if (!str || !subs) {
		return str;
	}
	var ret = [];
	var s = str.split(/(%s|\$[0-9]+)/); //这是非常有趣的用法，js的字符串灵活性极大，IE下看起来不兼容
	var i = 0;
	do {
		ret.push(s.shift()); //看起来是传入字符
		if (!s.length) {
			break;
		}
		var cmd = s.shift();
		if (cmd == '%s') {
			if (i < subs.length) {
				ret.push(subs[i]);
			} else {
				ret.push(cmd);
			}
			++i;
		} else {
			var j = parseInt(cmd.replace('$', ''), 10) - 1;
			if (j > -1 && j < subs.length) {
				ret.push(subs[j]);
			} else {
				ret.push(cmd);
			}
		}
	} while (s.length > 0);
	return ret.join('');
}