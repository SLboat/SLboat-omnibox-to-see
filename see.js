var currentRequest = null; //��ǰ����

//�������¼�
chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
	if (currentRequest != null) {
		currentRequest.onreadystatechange = null;
		currentRequest.abort();
		currentRequest = null;
	}

	updateDefaultSuggestion(text);

	if (text.length > 0) {
		currentRequest = suggests(text, function (data) { //���嵱ǰ���������Ա��������
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

//����Ĭ�Ͻ���
function resetDefaultSuggestion() {
	chrome.omnibox.setDefaultSuggestion({
		description: ' '
	});
}

resetDefaultSuggestion();
var searchLabel = chrome.i18n.getMessage('search_label');

//����Ĭ������
function updateDefaultSuggestion(text) {
	chrome.omnibox.setDefaultSuggestion({
		description: searchLabel + ': %s'
	});

}
//��ʼ����
chrome.omnibox.onInputStarted.addListener(function () {
	updateDefaultSuggestion('');
});

// ����ȡ��
chrome.omnibox.onInputCancelled.addListener(function () {
	resetDefaultSuggestion();
});


// ����������
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
	req.onerror = function () {}; //�հ�����
	req.send();
}

//ǰ�е���վ
function navigate(url) {
	chrome.tabs.getSelected(null, function (tab) {
		chrome.tabs.update(tab.id, {
			url: url
		});
	});
}

//����Ҫ���뵽��վ��ʱ��
chrome.omnibox.onInputEntered.addListener(function (text) {
	navigate("http://see.sl088.com/w/index.php?search=" + text);
});