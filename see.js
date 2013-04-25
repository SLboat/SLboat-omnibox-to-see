var currentRequest = null; //当前请求

//获得最后一个字符，看起来还有更好的方式啊
function get_lastchar(text){
	if (text.length>0)
	{
			return {"last": text.charAt(text.length-1), "str": text.substr(0,text.length-1)}; //返回一个原型包含位置和长度
	}
	return null;  //送回一个空，不介意吧
}

//绑定输入事件
chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
	//停止上次事件，看起来像是做了这个
	if (currentRequest != null) {
		currentRequest.onreadystatechange = null;
		currentRequest.abort();
		currentRequest = null;
	}

	updateDefaultSuggestion("直接在见识寻找: %s");

	if (text.length > 0) {
		//处理增加模式
		if (get_lastchar(text).last=="+")
		{
			//处置默认的玩意，默认的时候传出去的content就是本身咯
			updateDefaultSuggestion("直接在见识里建造: "+get_lastchar(text).str);
			//后面就没活干了
			//text=text.replace("+","");
		}
		//定义当前请求函数，以便后来请求
		currentRequest = get_suggests(text, function (data) {  //处理返回的json如何处置
				var results = [];
				//这是每一个结果的处置
				for (var i = 0; i < data[1].length; i++) { //处理第一项
					var data_take=data[1][i] //处理这个玩意
					//push入数据
					results.push({
						content: data_take, //这是发送给输入事件的数据
						description: data_take +"\t       <dim>>发现在见识标题 </dim>" //这是描述
					});
				}
				//玩意不知道是干嘛的-它是直接传递给回调函数处理结果的玩意
				suggest(results); //提交结果，完事
			});
	} else {//直接现实最近的
				var results = [];
				results.push({
					content: "即将出现", //这是发送给输入事件的数据
					description: "就快出现了" +"\t       <dim>>发现在见识标题 </dim>" //这是描述
				});
				suggest(results);
	}
});
//恢复到默认玩意
function resetDefaultSuggestion() {
	chrome.omnibox.setDefaultSuggestion({
		description: ' '
	});
}

//更新默认输入，也就是第一个玩意，当还没有结果返回的时候得到它
//如果需要输入内容，那就输入%s
function updateDefaultSuggestion(text) {
	chrome.omnibox.setDefaultSuggestion({
		description: text
	});
}

// 开始输入
chrome.omnibox.onInputStarted.addListener(function () {
	updateDefaultSuggestion('开始在航海见识探索吧');
});

// 输入取消
chrome.omnibox.onInputCancelled.addListener(function () {
	resetDefaultSuggestion();
});


// 获得搜索结果
function get_suggests(query, callback) {
	var request_str="http://see.sl088.com/w/api.php?action=opensearch&suggest&search=" + query; //构造字串
	var req = new XMLHttpRequest();

	req.open("GET", request_str , true);
	req.onload = function () {
		if (this.status == 200) {
			try {
				//传递返回内容
				callback(JSON.parse(this.responseText));
			} catch (e) {
				this.onerror();
			}
		} else {
			this.onerror();
		}
	};
	req.onerror = function () {}; //空包函数
	req.send();
}

// 获得最近结果
function get_recently(query, callback) {
	var req = new XMLHttpRequest();

	req.open("GET", "http://see.sl088.com/w/api.php?action=query&list=recentchanges&format=json&rcnamespace=0&rclimit=10&rctype=edit%7Cnew&rctoponly", true);
	req.onload = function () {
		if (this.status == 200) {
			try {
				//传递返回内容
				callback(JSON.parse(this.responseText));
			} catch (e) {
				this.onerror();
			}
		} else {
			this.onerror();
		}
	};
	req.onerror = function () {}; //空包函数
	req.send();
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
	if (get_lastchar(text).last=="+")
		//新增加一个玩意
		navigate("http://see.sl088.com/w/index.php?action=edit&title=" + get_lastchar(text).str);
	else
		//正常情况下，当一样的时候让它自己跳转
		navigate("http://see.sl088.com/w/index.php?search=" + text);
});

//获得当前的tab，留待使用
Get_Currtab=function(){
    chrome.tabs.getSelected(function(tab)
    {
        console.debug("当前的标签是:",tab); //tab.url 就是url地址了
    });
}