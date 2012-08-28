var currentRequest = null; //当前请求

//恢复到默认玩意
function resetDefaultSuggestion() {
	chrome.omnibox.setDefaultSuggestion({
		description: ' '
	});
}

//获得最后一个字符
function getlastchar(text){
	if (text.length>0)
	{
			return {"last": text.charAt(text.length-1), "str": text.substr(0,text.length-1)}; //返回一个原型包含位置和长度
	}
	return null;  //送回一个空，不介意吧
}

//清空准备使用
resetDefaultSuggestion();

//绑定输入事件
chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
	//停止上次事件，看起来像是做了这个
	if (currentRequest != null) {
		currentRequest.onreadystatechange = null;
		currentRequest.abort();
		currentRequest = null;
	}

	updateDefaultSuggestion(text);

	if (text.length > 0) {
		//处理增加模式
		if (getlastchar(text).last=="+")
		{
			//处置默认的玩意，默认的时候传出去的content就是本身咯
			updateDefaultSuggestion("直接在见识里建造: "+getlastchar(text).str);
		}
		//定义当前请求函数，以便后来请求
		currentRequest = suggests(text, function (data) {  //处理返回的json如何处置
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
			//玩意不知道是干嘛的
			suggest(results);
		});
	} else {

	}
});

//更新默认输入，也就是第一个玩意
//需要传递包含%s
function updateDefaultSuggestion(text) {
	var deftext //定义文字
	if (typeof(text)=="undefined" || text=='')
			deftext = '直接在见识寻找: %s'
		else
			deftext=text
	chrome.omnibox.setDefaultSuggestion({
		description: deftext
	});
}

//开始输入
chrome.omnibox.onInputStarted.addListener(function () {
	updateDefaultSuggestion('');
});

// 输入取消
chrome.omnibox.onInputCancelled.addListener(function () {
	resetDefaultSuggestion();
});


// 获得搜索结果
function suggests(query, callback) {
	var req = new XMLHttpRequest();

	req.open("GET", "http://see.sl088.com/w/api.php?action=opensearch&namespace=0&suggest=&search=" + query, true);
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

//当需要进入到网站的时候
chrome.omnibox.onInputEntered.addListener(function (text) {
	if (getlastchar(text).last=="+")
		//新增加一个玩意
		navigate("http://see.sl088.com/w/index.php?action=edit&title=" + getlastchar(text).str);
	else
		//正常情况下
		navigate("http://see.sl088.com/w/index.php?search=" + text);
});