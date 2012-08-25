var currentRequest = null; //当前请求

//绑定输入事件
chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
	if (currentRequest != null) {
		currentRequest.onreadystatechange = null;
		currentRequest.abort();
		currentRequest = null;
	}

	updateDefaultSuggestion(text);

	if (text.length > 0) {
		currentRequest = suggests(text, function (data) { //定义当前请求函数，以便后来请求
			var results = [];

			for (var i = 0; i < data[1].length; i++) {
				results.push({
					content: data[1][i],
					description: data[1][i]
				});
			}

			suggest(results);
		});
	} else {

	}
});

//给予默认建议
function resetDefaultSuggestion() {
	chrome.omnibox.setDefaultSuggestion({
		description: ' '
	});
}

resetDefaultSuggestion();
var searchLabel = chrome.i18n.getMessage('search_label');

//更新默认输入
function updateDefaultSuggestion(text) {
	chrome.omnibox.setDefaultSuggestion({
		description: searchLabel + ': %s'
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
	navigate("http://see.sl088.com/w/index.php?search=" + text);
});