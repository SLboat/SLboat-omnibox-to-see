var currentRequest = null; //当前请求
var site_url = "http://see.sl088.com";

/* 调试配置 */
isdebug=true;

/* 常规性配置 */
var perfix_edit = "+"; //前缀编辑模式
var perfix_edit_newtab = "+n"; //前缀编辑模式、新窗口，它似乎依赖于前者

/* 常规检查官-检查是否在特定的编辑模式下 
 * 返回构建：
 * isedit:是否编辑，isnew:是否新建，newtext:过滤后的文字
 */
function edit_chk(text){ //检查编辑模式
	var result={isedit: false, isnew: false, newtext: text}; //返回构造

	if (str_chklast(text,perfix_edit) || str_chklast(text,perfix_edit_newtab)) {
		result.isedit = true; //设置标记
		result.newtext = str_getlast(text,perfix_edit.length).str; //返回剩余的一部分
	}
	if(str_chklast(text,perfix_edit_newtab)) {
			result.isnew = true; //单独的标记
	}
	return result;//返回构建
}

/* 输入变动 
 * 这是一切工作的核心
 * todo：拆散化，建立子函数们一起工作
 */
chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
	var req_url; //申请url，json
	var str_new_win="进入<url>当前海域</url>"; //新窗口的玩意？

	var edit_type; //编辑模式的玩意

	//停止上次事件，看起来像是做了这个
	if (currentRequest != null) {
		currentRequest.onreadystatechange = null;
		currentRequest.abort();
		currentRequest = null;
	}

	put_info("<url>直接进入</url>森亮号航海见识开始探索[<match>%s</match>]");

	//处理编辑模式字符，看起来没啥坏处
	edit_type = edit_chk(text); //检查类型
	text = edit_type.newtext; //文字也处理了
	if (edit_type.isnew){
		//新的标记方式，字符串全部索引起来？
		str_new_win = "进入<url>最近的海域</url>";
	}
	if (edit_type.isedit)
	{
		put_info("它还不存在,现在" + str_new_win + "<url>建造</url>见识<url>[" + text +"]</url>!" );
	}

	if (text.length > 0 && text != "最近" ) { //过滤最近，但不排除无
		get_suggest(text,edit_type,str_new_win,function(results,org_data){ //原始数据为一个字串表
			suggest(results); //传回建议的内容
		});
	} else { //直接现实最近的
			slboat_getrecently(function(results){
				suggest(results); //闭包回来处理
			});
  } //最终结束
});

/* 获得标题匹配见识
 * 传入原始字串，标题特征，回调函数
 * 回调建议结果，标题序列
 * 最基础的变动匹配
 * 它可能会很长
 */
 function get_suggest(text,edit_type,str_new_win,callback){
		//处理增加模式
		req_url = site_url + "/w/api.php?action=opensearch&limit=6&suggest&search=" + text; //构造字串
		//定义当前请求函数，以便后来请求
		currentRequest = get_json(req_url, function (data) { //处理返回的json如何处置
			var results = [];
			//用于一个本地的保留备份
			result_arry = data[1]; //返回的数组，长度0就是没有结果，非全局非本地
			if (result_arry.length == 0) {
				return false; //退出，将失去一切
			}
			//这是每一个结果的处置
			for (var index = 0; index < result_arry.length; index++) { //处理第一项
				var data_take = result_arry[index]; //处理这个玩意
				if (data_take == str_up1letter(text)) //完全匹配-除了首字母
				{
					//一致提醒
					if (edit_type.isedit){
							put_info("探索到了!"+ str_new_win +"<url>重新</url	>见识<url>[" + text + "]</url>!"); //处理不一致的文字
					}else {put_info("噢!太好了!探索到存在<url>["+ text + "]</url>的见识!前往所在地吗?");}

				}
				//制造高亮玩意
				var text_re = new RegExp(text, "i");
				var match_part = data_take.match(text_re);
				var match_str=data_take.replace(match_part,"<match>"+ match_part +"</match>"); //高亮有的话，被处理了大小写
				//push入数据
				results.push({
					content: data_take, //这是发送给输入事件的数据，如果和输入一样，不会被送入
					description: match_str + "\t       <dim>->存在于在航海见识,正在更深入探索</dim>" //这是描述
				});
			}
			//返回原始标题，以及结果
			callback(results,data_take); //或许还要点别的？	
		});//完成任务
 }

/* 获得最近的见识 
 * 给予需要的，获得想要的
*/
function slboat_getrecently(callback){
		put_info("输入标题来探索航海见识,而这是<url>[最近]</url>见识：");
		//todo，函数式改写，太有点混世了
		//仅获得六个
		req_url = site_url + "/w/api.php?action=query&list=recentchanges&format=json&rcnamespace=0&rclimit=6&rctype=edit%7Cnew&rctoponly";
		//如何移出去呢
		currentRequest = get_json(req_url, function (data) {
			var results = [];
			//todo：不要一次性算出两级，错误太多
			var result_arry = data.query.recentchanges; //返回的数组，长度0就是没有结果
			if (typeof(result_arry) == "undefined") {
				return false; //无效退出
			}
			//这是每一个结果的处置
			for (var index = 0; index < result_arry.length; index++) { //处理第一项
				var data_take = result_arry[index].title //处理这个玩意
				//push入数据
				results.push({
					content: data_take, //这是发送给输入事件的数据
					description: data_take + "\t       <dim>->最近的见识</dim><url>["+ index + "]</url>" //这是描述
				});
			}
			callback(results); //提交结果，完事
		});
}


//恢复到默认玩意，没有任何提醒
function resetDefaultSuggestion() {
	chrome.omnibox.setDefaultSuggestion({
		description: ' '
	});
}

//更新默认输入，也就是第一个玩意，当还没有结果返回的时候得到它
//如果需要输入内容，那就输入%s

function put_info(text) {
	//默认的只能传送文字，遗憾的
	chrome.omnibox.setDefaultSuggestion({
		description: text
	});
}

// 开始输入，有了第一次反应
chrome.omnibox.onInputStarted.addListener(function () {
	put_info('开始在航海见识探索吧');
	console.log("本次输入开始了...");
});

// 结束了输入了-发生在输入过，然后全部删除，输入了，然后离开了输入框
chrome.omnibox.onInputCancelled.addListener(function () {
	console.log("本次输入结束了..");
});

//显示错误信息，e为错误事件

function put_error(e) {
	put_info("探索见识的时候发生了错误: [" + e.message + "]");
}

// 获得json搜索结果
function get_json(req_url, callback) {
	var req = new XMLHttpRequest();

	req.open("GET", req_url, true);
	req.onload = function () {
		if (this.status == 200) {
			try {
				//传递返回内容
				callback(JSON.parse(this.responseText)); //传回原始信息，这里过滤了reponseText
			} catch (e) {
				put_error(e);
			}
		} else {
			put_error(e);
		}
	};
	req.send();
	return req; //返回原型
}

/* 前往海域-当前海域
 */
function tab_go(url) {
	chrome.tabs.getSelected(null, function (tab) { //这就是获得了当前的tab哦
		chrome.tabs.update(tab.id, {
			url: url
		});
	});
}

/* 前往海域-附近海域 
 */
function tab_new(url) {
		chrome.tabs.getSelected(null, function (tab) { //这就是获得了当前的tab哦
		chrome.tabs.create({
			index: tab.index + 1, //序号+1
			url: url
		});
	});
}

/* 当：选择了一项见识里的玩意
 * 将：去往那个见识的地方
 */
chrome.omnibox.onInputEntered.addListener(function (text) {
	tips_title = "森亮Chrome扩展 森亮见识墨水/探索提醒"
	var edit_link = "http://see.sl088.com/w/index.php?action=edit&editintro="+ 
					encodeURIComponent(tips_title) + "&title=" 
	if (str_chklast(text,perfix_edit_newtab)){ //一起+那就放回去
		//新增加一个玩意
		tab_new(edit_link+str_getlast(text,2).str); //末尾多算一点

	}else if (str_chklast(text,perfix_edit)){
		tab_go(edit_link+str_getlast(text).str);

	}else{
	//正常情况下，当一样的时候让它自己跳转
		tab_go("http://see.sl088.com/w/index.php?search=" + text);
	}
});

/* 获得当前的tab，留待使用
 * 它可以获得，而且看起来并不是很疯狂
 */
tab_getnow = function () {
	chrome.tabs.getSelected(function (tab) {
		console.debug("当前的标签是:", tab); //tab.url 就是url地址了
	});
}

/* 记录日志信息，简单的 
 * 有时候简单或许就是更好的
 */
function log(info){
	if (isdebug)
	{
		console.log("调试信息");
	}

}