var currentRequest = null; //当前请求

//获得最后一个字符，看起来还有更好的方式啊
function get_lastchar(text) {
	if (text.length > 0) {
		return {
			"last": text.charAt(text.length - 1),
			"str": text.substr(0, text.length - 1)
		}; //返回一个原型包含位置和长度
	}
	return null; //送回一个空，不介意吧
}

//大写首字母的，别的的不变
function up_first_letter(text){
	return text.charAt(0).toUpperCase()+text.substr(1,text.length);
}

//绑定输入事件
chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
	var isedit = false; //编辑模式

	//停止上次事件，看起来像是做了这个
	if (currentRequest != null) {
		currentRequest.onreadystatechange = null;
		currentRequest.abort();
		currentRequest = null;
	}

	put_info("进入森亮号航海见识开始探索[%s]");

	if (text.length > 0 && text != "最近" ) { //过滤最近
		//处理增加模式
		if (get_lastchar(text).last == "+") {
			isedit = true; //设置标记
			//处置默认的玩意，默认的时候传出去的content就是本身咯
			put_info("进入森亮号航海见识开始建造: " + get_lastchar(text).str);
			//todo:如果原始有加号呢？
			text = get_lastchar(text).str; //排除+号来工作
		}
		//定义当前请求函数，以便后来请求
		currentRequest = get_suggests(text, function (data, org_text) { //处理返回的json如何处置
			var results = [];
			var result_arry = data[1]; //返回的数组，长度0就是没有结果
			if (result_arry.length == 0) {
				return false; //退出
			}
			//这是每一个结果的处置
			for (var index = 0; index < result_arry.length; index++) { //处理第一项
				var data_take = result_arry[index]; //处理这个玩意
				if (data_take == up_first_letter(org_text)) //完全匹配-除了首字母
				{
					//一致提醒
					if (isedit){
							put_info("进入航海见识中立即开始<dim>编辑</dim>见识<url>[" + org_text + "]</url>！"); //处理不一致的文字
					}else {put_info("噢!太好了!探索到存在<url>["+ org_text + "]</url>的见识!前往所在地吗?");}

				}
				//制造高亮玩意
				var re = new RegExp(org_text, "i");
				var match_str=data_take.replace(re,"<match>"+org_text+"</match>"); //高亮有的话
				//push入数据
				results.push({
					content: data_take, //这是发送给输入事件的数据，如果和输入一样，不会被送入
					description: match_str + "\t       <dim>->存在于在航海见识 正在更深入探索</dim>" //这是描述
				});
			}
			//玩意不知道是干嘛的-它是直接传递给回调函数处理结果的玩意
			suggest(results); //提交结果，完事
			//等待更深一步探索

		});
	} else { //直接现实最近的
		put_info("输入标题来探索航海见识,而这是<url>[最近]</url>见识：");
		currentRequest = get_recently(text, function (data) {
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
			suggest(results); //提交结果，完事
		});
		//处理完毕
  }
});

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

// 获得搜索结果

function get_suggests(query, callback) {
	var req_url = "http://see.sl088.com/w/api.php?action=opensearch&suggest&search=" + query; //构造字串
	var req = new XMLHttpRequest();

	req.open("GET", req_url, true);
	req.onload = function () {
		if (this.status == 200) {
			try {
				//传递返回内容
				callback(JSON.parse(this.responseText), query); //传回原始文字，这里过滤了reponseText
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

// 获得最近结果

function get_recently(query, callback) {
	//传输地址
	var req_url = "http://see.sl088.com/w/api.php?action=query&list=recentchanges&format=json&rcnamespace=0&rclimit=10&rctype=edit%7Cnew&rctoponly";
	var req = new XMLHttpRequest();

	req.open("GET", req_url, true);
	req.onload = function () {
		if (this.status == 200) {
			try {
				//传递返回内容
				callback(JSON.parse(this.responseText));
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

//前行到网站

function navigate(url) {
	chrome.tabs.getSelected(null, function (tab) {
		chrome.tabs.update(tab.id, {
			url: url
		});
	});
}

// 选择了一项见识里的玩意
chrome.omnibox.onInputEntered.addListener(function (text) {
	if (get_lastchar(text).last == "+")
	//新增加一个玩意
		navigate("http://see.sl088.com/w/index.php?action=edit&title=" + get_lastchar(text).str);
	else
	//正常情况下，当一样的时候让它自己跳转
		navigate("http://see.sl088.com/w/index.php?search=" + text);
});

//获得当前的tab，留待使用
Get_Currtab = function () {
	chrome.tabs.getSelected(function (tab) {
		console.debug("当前的标签是:", tab); //tab.url 就是url地址了
	});
}