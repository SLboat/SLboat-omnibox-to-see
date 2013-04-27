var currentRequest = null; //当前请求
var site_url = "http://see.sl088.com";
var redict_text = {from:"", to:""}; //默认的重定向信息

/* 调试配置 */
isdebug = true;

/* 常规性配置
 * 可以量化为object？
 */
var perfix_edit = "+"; //前缀编辑模式
var perfix_edit_newtab = "*"; //前缀编辑模式、新窗口，它似乎依赖于前者
var perfix_search_fulltext = "."; //搜索全部文本

var need_more = true; //需要更多信息

/* 常规检查官-检查是否在特定的编辑模式下 
 * 返回构建：
 * isedit:是否编辑，isnew:是否新建，newtext:过滤后的文字
 */
function edit_chk(text) { //检查编辑模式
	var result = {
		isedit: false,
		isnew: false,
		newtext: text,
		isfind: false //搜索模式
	}; //返回构造

	if (str_chklast(text, perfix_edit)) {
		result.isedit = true; //设置标记
		result.newtext = str_getlast(text, perfix_edit.length).str; //返回剩余的一部分
	}

	if (str_chklast(text, perfix_edit_newtab)) {
		result.isedit = true; //编辑模式
		result.isnew = true; //单独的标记
		result.newtext = str_getlast(text, perfix_edit_newtab.length).str; //切除
	}

	if (str_chklast(text, perfix_search_fulltext)) { //防止冲突？
		result.isfind = true; //单独的标记
		result.newtext = str_getlast(text, perfix_search_fulltext.length).str; //切除
	}
	return result; //返回构建
}

/* 输入变动 
 * 这是一切工作的核心
 * todo：拆散化，建立子函数们一起工作
 */
chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
	var req_url; //申请url，json
	var str_new_win = "进入<url>当前海域</url>"; //新窗口的玩意？

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
	if (edit_type.isnew) {
		//新的标记方式，字符串全部索引起来？
		str_new_win = "进入<url>最近的海域</url>";
	}
	if (edit_type.isedit) {
		put_info("它还不存在,现在" + str_new_win + "<url>建造</url>见识<url>[" + text + "]</url>!");
	}

	redict_text = {from:"", to:""}; //初始化重定向信息
	if (text.length > 0 && text != "最近") { //过滤最近，但不排除无
		if (edit_type.isfind) //搜索模式
		{
			get_search_text(text,function(results){
					suggest(results); //搜索建议释放
			});
		}else{ //非搜索模式
			get_suggest(text, edit_type, str_new_win, function (results, org_data) { //原始数据为一个字串表
					if (need_more) //需要更多信息，提醒应该换换
					{
						get_more_info(text, edit_type, str_new_win, results, org_data, function(results){
							suggest(results); //传回最终研究内容
						}); //呼叫下一回合
					}else{suggest(results)}; //传回建议的内容
			});
		}
	} else { //直接现实最近的
		slboat_getrecently(function (results) {
			suggest(results); //闭包回来处理
		});
	} //最终结束
});

/* 获得全文搜索建议
 * 传入原始字串
 * 回调搜索建议
 * 它将会很酷
 */
function get_search_text(){

}

/* 获得标题匹配见识
 * 传入原始字串，标题特征，回调函数
 * 回调建议结果，标题序列
 * 最基础的变动匹配
 * 它可能会很长
 */
function get_suggest(text, edit_type, str_new_win, callback) {
	//处理增加模式
	req_url = site_url + "/w/api.php?action=opensearch&limit=6&suggest&search=" + encodeURIComponent(text); //构造字串
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
			var title_get = result_arry[index]; //处理这个玩意
			if (str_is_about_same(title_get,text)) //完全匹配-除了大概一样
			{
				//一致提醒
				if (edit_type.isedit) {
					put_info("探索到了!" + str_new_win + "<url>重新</url	>见识<url>[" + title_get + "]</url>!"); //处理不一致的文字
				} else {
					put_info("噢!太好了!探索到存在<url>[" + title_get + "]</url>的见识!前往所在地吗?");
				}
				//写入重定向
				redict_text.from = text;
				redict_text.to = title_get;
			}
			var match_str = ominibox_get_highline(title_get,text);
			//push入数据，只是坏情况发生的时候
			results.push({
				content: title_get, //这是发送给输入事件的数据，如果和输入一样，不会被送入，看起来就是新的建议啥的
				description: match_str + "\t       <dim>->存在于在航海见识, 但无法更深入探索</dim>" //这是描述
			});
		}
		//返回原始标题，以及结果
		callback(results, result_arry); //或许还要点别的？	
	}); //完成任务
}

/* 获得最近的见识 
 * 给予需要的，获得想要的
 */
function slboat_getrecently(callback) {
	put_info("输入标题来探索航海见识,而这是<url>[最近]</url>见识：");
	//todo，函数式改写，太有点混世了
	//仅获得六个
	req_url = site_url + "/w/api.php?action=query&list=recentchanges&format=json&rcnamespace=0&rclimit=6&rctype=edit%7Cnew&rctoponly";
	//如何移出去呢
	currentRequest = get_json(req_url, function (data) {
		var results = [];
		//todo：不要一次性算出两级，错误太多
		var result_arry = data.query.recentchanges; //返回的数组，长度0就是没有结果
		if (typeof (result_arry) == "undefined") {
			return false; //无效退出
		}
		//这是每一个结果的处置
		for (var index = 0; index < result_arry.length; index++) { //处理第一项
			var title_get = result_arry[index].title //处理这个玩意
			//push入数据
			results.push({
				content: title_get, //这是发送给输入事件的数据
				description: title_get + "\t       <dim>->最近的见识</dim><url>[" + index + "]</url>" //这是描述
			});
		}
		callback(results); //提交结果，完事
	});
}

/* 获得进一步信息，更进一步 
 * 传入键入字符，新窗口标记，编辑类型（用于标记重定向），初步获得见识信息，原始标题序列，回调结果函数
 * 回调输出结果-标准格式
 */
function get_more_info(text, edit_type, str_new_win, faild_results, result_arry, callback) {
	//等待更深一步探索
	var titles_all = result_arry.join("|"); //拼凑字符串，用于标题
	var req_url = site_url + "/w/api.php?action=query&prop=categories&format=json&cllimit=6&redirects&indexpageids&titles=" + encodeURIComponent(titles_all);
	var onfaild=function(e) //如果发生了错误
	{
		put_info("更深入探索见识的时候发生了些意外: [" + e.message + "], 这是初步探索");
		callback(faild_results); //传回失败的数据
		return false;
	}
	//开始解析
	currentRequest = get_json(req_url, function (data) {
		var results = []; //最终结果
		var titles_arr = {}; //标题建立的一个查询队列
		//重定向解析
		var redirects_arr = data.query.redirects
		if (issth(redirects_arr)) {
			//待处理重定向
			for (var index in redirects_arr) {
				var title_redirect = redirects_arr[index];
				//初始化等待
				titles_arr[title_redirect.from] = {}; //几乎不会再被使用
				titles_arr[title_redirect.from].to = title_redirect.to; //重定向指向，初步直针	
			}
		}
		//给它转过去，让它飞翔
		for (page_ids in data.query.pages) {
			//这是处理的开始了
			if (page_ids > 0) //有效的话
			{
				var titles_now = data.query.pages[page_ids].title
				if (typeof (titles_arr[titles_now]) == "undefined") {
					titles_arr[titles_now] = {}; //再次初始化
				}
				titles_arr[titles_now].to = ""; //这里不再被转录
				//获得分类，唯一要紧的事
				var all_categories = data.query.pages[page_ids].categories
				titles_arr[titles_now].kat = ""; //初始化分类转录
				if (typeof (all_categories) != "undefined") {
					//有分类，转录分类
					for (var categorie in all_categories) {
						titles_arr[titles_now].kat += "[" + all_categories[categorie].title.replace("分类:", "") + "]"; // kat-cat-分类们
					}
				}
				log(titles_now + "拥有分类: " + titles_arr[titles_now].kat);
			} else {
				log("一个无效结果");
			}
		}
		//转录开始
		for (var index = 0; index < result_arry.length; index++) { //处理第一项
			var title_get = result_arry[index];
			var should_get = title_get; //将调查的数据
			var match_str = ominibox_get_highline(title_get,text); //匹配标题
			var def_show_info = match_str + "\t       <dim>-->"; //默认标题信息
			var show_info = def_show_info; //探索进一步的信息串
			//todo，匹配信息
			if (issth(titles_arr[title_get]) && titles_arr[title_get].to != "") //检查重定向
			{
				should_get = titles_arr[title_get].to; //指向重定向
				show_info += "被指引!它将带到<url>[" + should_get + "]</url>!\t";
				if (str_is_about_same(title_get,text)) //如果默认就有重定向，忽视大小写
				{
					redict_text.from = text;
					redict_text.to = should_get;
					if (edit_type.isedit) {
						put_info("探索到了!但它去往<url>被指引</url>," + str_new_win + "<url>重新</url	>见识<url>[" + should_get + "]</url>!"); //处理不一致的文字
					} else {
						put_info("噢!太好了!探索到存在，只是<url>被指引</url>去了<url>[" + should_get + "]</url>的见识!前往所在地吗?");
					}
				}
			}
			if (issth(titles_arr[should_get]) && titles_arr[should_get].kat != "") //拥有一些玩意
			{
				show_info += "见识位于分类<url>" + titles_arr[should_get].kat + "</url>";
			}
			if (show_info == def_show_info) { //没有探索到
				show_info += "存在于在航海见识\t更深入探索失败" //这是描述
			}
			show_info += "</dim>"; //匹配结束
			if (title_get == text){ //完全一样会不显示
			    title_get += "_"; //加一个无关紧要的进去
			}
			/* 构建最终返回字串 */
			results.push({
				content: title_get, //无所谓传入老的，因为新的会再次更新
				description: show_info //这是描述
			});
		}
		callback(results); //提交结果，完事
		//再次push就好
	}, onfaild)
	//回调回去
}

/* 去除一切提醒的玩意 */
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
	log("本次输入开始了...");
});

// 结束了输入了-发生在输入过，然后全部删除，输入了，然后离开了输入框
chrome.omnibox.onInputCancelled.addListener(function () {
	log("本次输入结束了..");
});

//显示错误信息，e为错误事件

function put_error(e) {
	put_info("探索见识的时候发生了错误: [" + e.message + "]");
}

/* 获得json搜索结果 
 * 传入寻找地址，回调函数
 * todo：增加一个onerror处理事件，用来比如不能获得进一步信息
 */
function get_json(req_url, callback, onerror) {
	var req = new XMLHttpRequest();
	if (typeof(onerror) == "function")//如果是函数
	{
		errhand=onerror;
	}else{errhand=put_error;}
	req.open("GET", req_url, true);
	req.onload = function () {
		if (this.status == 200) {
			try {
				//传递返回内容
				callback(JSON.parse(this.responseText)); //传回原始信息，这里过滤了reponseText
			} catch (e) {
				errhand(e);
			}
		} else {
			errhand(e);
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
	tips_title = "森亮Chrome扩展 森亮见识墨水/探索提醒";
	edit_type = edit_chk(text); //检查类型
	text = edit_type.newtext; //文字也处理了
	var edit_link = "http://see.sl088.com/w/index.php?action=edit&editintro=" +
		encodeURIComponent(tips_title) + "&title="

	if (edit_type.isnew) { //一起+那就放回去
		tab_new(edit_link + chk_redict(text)); //处理重定向

	} else if (edit_type.isedit) {
		tab_go(edit_link + chk_redict(text));

	} else {
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

function log(info) {
	if (isdebug) {
		console.log("调试信息：", info);
	}
}

/* 判断是否是一些东西
 * 而不是未定义-undefined
 * todo：字符串加上自动判断""?
 */
function issth(anything) {
	return typeof (anything) != "undefined";
}

/* 处理重定向信息 
 * 返回处理后的重定向信息
 */
 function chk_redict(text){
 	if (redict_text.from==text && redict_text.to!="") //有重定向信息
	{
		text=redict_text.to; //去往重定向页
	}
	return text; //放回去
 }