/* 字符串处理的子函数们，它们为字符串而生 */
/* 匹配尾部字符是否一致，并进行切割
 * 送入原始字符，匹配字符
 * 返回: 布尔值，判决结果
 */
//todo，last可为数组，进行连续匹配

function str_chklast(text, last) {
	//如果是正则表达式方式，从尾部匹配开始，计算是否有效匹配获得
	if (last.length > 0) //有传入
	{
		return (str_getlast(text, last.length).last == last) //匹配送回去有效
	}
	return false;
}

/* 获得最后的字符，如果没有长度就获得最后一个
 * 返回：
 * result.last: 最后字符
 * result.str: 切除尾巴后的字符
 */
//TODO: 根据文本数组来一个个匹配一个包含一致，并且给出切割后的
//TODO: 根据传入的是数字或者字符串来决定它的行为,数字位length,字符串则是原生长度

function str_getlast(text, how_long) {
	var how_long = how_long || 1; //默认值
	if (text.length > 0) {
		return {
			"last": text.substr(text.length - how_long, how_long), //切断尾部
			"str": text.substr(0, text.length - how_long)
		}; //返回一个原型包含位置和长度
	}
	return { //返回全空白
		"last": "",
		"str": ""
	};
}

/* 匹配头部字符是否一致
 * 送入原始字符，匹配字符
 * 返回: 布尔值，判决结果
 */

function str_chkfirst(text, first) {
	//如果是正则表达式方式，从尾部匹配开始，计算是否有效匹配获得
	if (first.length > 0) //有传入
	{
		return (str_getfirst(text, first.length).first == first) //匹配送回去有效
	}
	return false;
}

/* 获得开头的字符，如果没有长度就获得第一个
 * 返回：
 * result.first: 开头的字符
 * result.str: 切除开头后的字符
 */

function str_getfirst(text, how_long) {
	if (typeof(how_long) == "undefined") {
		how_long = 1; //未指定赋予1
	}
	if (text.length > 0) {
		return {
			"first": text.substr(0, how_long), //切断尾部
			"str": text.substr(how_long, text.length - how_long)
		}; //返回一个原型包含位置和长度
	}
	return { //返回全空白
		"first": "",
		"str": ""
	};
}

/* 获得最后的字符的重复次数，如果没有重复就返回0
 * 传入原始字符串，匹配单字符
 * 返回：
 * result.times: 重复次数
 * result.str: 切除尾巴后的字符
 */

function str_getlastbytimes(text, lett) {
	var results = {
		times: 0,
		str: ""
	}; //默认字串

	while (text.charAt(text.length - 1) == lett) {
		results.times++; //增加一次
		text = text.substr(0, text.length - 1); //除掉了一个
		results.str = text; //赋值进入
	}
	return results; //返回结果
}

/* 大写首字母的，别的的不变
 * 返回带大写的首字母
 */

function str_up1letter(text) {
	return text.charAt(0).toUpperCase() + text.substr(1, text.length);
}

/* 检查校准名字空间 
 * 给予原始字符串,然后校验掉
 * 比如[制造者+想法] → [想法:制造者]
 */
function slboat_replace_namespace(text, ns_namespace) {
	var check_namespaces = "+" + ns_namespace; //用于检查尾巴的字符
	if (text && str_chklast(text, check_namespaces)) {
		/* 重新生成子串去工作 */
		text = printf("%s:%s+", [ns_namespace, str_getlast(text, check_namespaces.length).str]);
	};
	return text;
};

/* 高亮匹配的部分-使用<match>语法
 *	传入获得的完整标题，输入的字符
 * 传回匹配串
 */

function ominibox_get_highline(title_get, text, which_tag) {
	//制造高亮玩意
	which_tag = which_tag || "match"; //哪种标记封装,默认是match
	var text_re = new RegExp(text+"(?!>)", "i");
	var match_part = title_get.match(text_re); //预测: 看起来只替换了一个
	var match_str = title_get.replace(match_part, printf("<%s>%s</%s>", [which_tag, match_part, which_tag])); //高亮有的话，被处理了大小写
	return match_str;
}

/* 高亮匹配所有内容-切除空格部分进行每一部分的匹配 */

function ominibox_get_highline_forall(title_get, text, which_tag) {
	var split_arr = text.split(/ +/); //切割空格
	which_tag = which_tag || "match"; //哪种标记封装,默认是match
	for (var i = 0; i < split_arr.length; i++) {
		/* 一直咬自己尾巴,直到没有尾巴,尾巴用空格做成 */
		title_get = ominibox_get_highline(title_get, split_arr[i], which_tag);
	};
	return title_get;
}

/* 处理特别命名空间里的空格描述方式
 *  传入待处理的标题,是否只是查询模式
 * 正常返回替换后的结果,查询模式返回匹配的名字空间
 * 目前支持[想法:],[短英语:],[分类:]
 */

function slboat_namespace_take(title, just_query) {
	/* 可供添加的还有扩展啥的 */
	var just_query = just_query || false;
	var ns_namespaces_arr = ["想法", "分类", "短英语", "单词"]; //支持的名字空间
	var match_namespace = ""; //无效的时候
	var the_check_add_patern = ""; //校验[:]模式关闭
	if (just_query) {
		the_check_add_patern = "|:"; //额外增加的校验模式
	};
	ns_namespaces_arr.every(function(ns_namespace) {
		var ns_match_patern = new RegExp(printf("^(%s)([ ]+%s)", [ns_namespace, the_check_add_patern]));
		if (title.match(ns_match_patern)) {
			match_namespace = ns_namespace;
			if (!just_query) {
				title = title.replace(ns_match_patern, "$1:"); //替换每一种符合的可能..
			}
			return false; //就此结束
		} else {
			return true; //继续来一回
		};
	});
	if (just_query) {
		return match_namespace;
	} else {
		return title; //返回最终标题
	};
};

/* 转换search返回的sniff的匹配字串
 * 输入原始的字串
 * 返回转换的字串
 */

function slboat_get_match(snippet) {
	var use_tag = "url"; //使用tag方式，可以用match、dim、url三个玩意
	//转换左标签
	snippet = snippet.replace(/<span class='searchmatch'>/g, "<" + use_tag + ">");
	//转换右标签
	snippet = snippet.replace(/<\/span>/g, "</" + use_tag + ">");

	//用XML处理后再来一次,这里还没有自动化处理,目前没有机会用上..
	//snippet = snippet.replace(/&lt;span class=&apos;searchmatch&apos;&gt;/g, "<" + use_tag + ">");
	//snippet = snippet.replace(/&lt;\/span&gt;/g, "</" + use_tag + ">");

	//todo:切割长度？看起来没必要
	return snippet;
}

/* 替换所有的XML特别字符(可能引来冲突的字符)
 * 输入要替换的内容
 * 替换字符[& ,> ," ,']
 * 注意: 这里不能用作结果的替换,只能作为结果获得值
 * 致谢:http://stackoverflow.com/questions/7918868/how-to-escape-xml-entities-in-javascript
 */

function ecsape_all_xmlstr(content) {
	return content.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
};

/* 送到航海见识墨水 */
function sendMessageToSee(ask) {
	/* 航海见识墨水的绑定ID */
	var seeExtensionId = "bddkhdgfapjjgmgpdflnmombmiejffoj";
	//开始发送
	chrome.runtime.sendMessage(seeExtensionId, ask);
}

/* 地址栏的小玩意，逃脱xml字符
 * 由小约子发现的# Bug而来。
 *	传入完整的结果
 * 传回逃跑了xml字符的结果
 */

function ominibox_ecsape_xmlstr_results(results) {
	var bad_xml_patern = /&(?!amp;|lt;|gt;|quot;|apos;)/g; //不合理的xml字符
	//开始检阅xml字符
	for (one in results) {
		/* 或许该让match来干活了 */
		if (results[one].description.search(/&/) > -1) //字符串的搜索大于-1才被释放，-1的是绝对好人
		{
			//这家伙有问题,开始处置程序,而且是全部替换
			results[one].description = results[one].description.replace(bad_xml_patern, "&amp;");;
		}
	}
	//送回去所有检阅完毕的人们
	return results;
}

/* 修理地址栏的真实长度
 * 背后的库都是小约子制造的小水手们的工作
 * 它们被发现并且被解决了
 * 传入描述信息，必须遵守长度协定
 * 传回修复的描述信息
 */

function ominibox_fix_desc(results) {
	//如何确保新的事件已经完成？进行初次调动化
	var longer = 0; //最长的家伙
	for (one in results) {
		var table_arr = results[one].description.split("\t"); //切割标题
		if (table_arr.length > 1 && fonts_fix.len(table_arr[0]) > longer) {
			longer = fonts_fix.len(table_arr[0]); //新的长度老大
		}
	}
	if (longer == 0) {
		longer == 60; //默认的60，小约子的风格
	} else {
		longer += 8; //最长的加10，这就够了
	}
	//切割标题
	for (one in results) {
		//开始获得一个
		var table_arr = results[one].description.split("\t");
		if (table_arr.length > 1) { //最坏的情况，没有切割，那时候是1
			table_arr[0] = ominibox_package_desc_title(table_arr[0]); //加上[.]，不然可能发生糟糕的事情，字符长度不一致
			table_arr[0] = fonts_fix.fix(table_arr[0], longer); //处理标题部分
			//组合，返回，送出
			results[one].description = table_arr.join("\t");
		}
	}
	//调试字体信息
	if (isdebug_fonts_fix) {
		results.forEach(function(i, index, arr) {
			console.log(i.description.replace(/<\/?match>/g, "").replace(/<\/?dim>/g, ""))
		})
	}
	return results;
}

/* 封装起来见识备注的标记信息 
 * 传入见识标题
 * 使用dim的封装标记进行封装
 */

function ominibox_package_desc_title(title) {
	//采用[封装],因为远仔看起来认为它看着很不错
	//再加上一层[]，因为它需要一点别的看起来更加的怪异
	return "<dim>[[</dim>" + title + "<dim>]]</dim>";
}

/* 匹配忽略大小写是否一致
 * 传入比较1、比较2
 * 返回是否非大小写一致
 */

function str_is_about_same(a, b) {
	return (a.length == b.length && a.match(RegExp(b, "i")) != null);

}

/* 记录日志信息，简单的 
 * 有时候简单或许就是更好的
 */

function log(info, date) {
	if (!isdebug) return false; //返回
	if (typeof(date) == "undefined") {
		console.log("调试信息：", info);
	} else {
		console.log("调试信息：", info, date);
	}
	return true;
}

function logme() {
	isdebug = !isdebug;
	console.log("船长!已经" + ((isdebug) ? "开启" : "关闭") + "了调试日志");
};

/* 复制文本到剪贴板里这样送出去咯 */

function copy_text(text) {
	//todo：检查些之前内容啥的
	var inkstand = document.getElementById('inkstand'); //不需要使用jQuery
	inkstand.value = text;
	inkstand.select();
	var rv = document.execCommand("copy"); //执行复制到这里
	return rv; //返回这玩意的执行
}

/* 尝试克隆一个object 
 * 致谢:http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object
 */

function obj_clone(obj) {
	if (obj == null || typeof(obj) != 'object')
		return obj;
	//这里似乎是得到原型等内容
	var temp = obj.constructor(); // changed

	for (var key in obj)
		temp[key] = obj_clone(obj[key]);
	return temp;
};

/* 得到一个看起来随机的大数字
 * 主要用来XHR啥子的
 */

function getatime() {
	return "?atime=" + new Date().getTime(); //获取当前时间作为随机数
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

/* 获得时间戳的日期差异 */
function getDateDiff(timestamp) {
	/* 由MW的时间戳好哦的日期,来自Gadget-Navigation popups */
	function getDateFromTimestamp(t) {
		var s = t.split(/[^0-9]/);
		switch (s.length) {
			case 0:
				return null;
			case 1:
				return new Date(s[0]);
			case 2:
				return new Date(s[0], s[1] - 1);
			case 3:
				return new Date(s[0], s[1] - 1, s[2]);
			case 4:
				return new Date(s[0], s[1] - 1, s[2], s[3]);
			case 5:
				return new Date(s[0], s[1] - 1, s[2], s[3], s[4]);
			case 6:
				return new Date(s[0], s[1] - 1, s[2], s[3], s[4], s[5]);
			default:
				return new Date(s[0], s[1] - 1, s[2], s[3], s[4], s[5], s[6]);
		};
	};

	function adjustDate(d, offset) {
		// offset is in minutes
		var o = offset * 60 * 1000;
		return new Date(+d + o);
	}

	/* 添加单位,来自Gadget-Navigation popups */
	function addunit(num, str) {
		var datestr = {
			'day': '天',
			'days': '天',
			'hour': '小时',
			'hours': '小时',
			'minute': '分钟',
			'minutes': '分钟',
			'second': '秒',
			'seconds': '秒',
			'week': '周',
			'weeks': '周',
		};
		var blank_str = ''; //错开字符,"xx分[ ]xx秒"
		return '' + num + blank_str + ((num != 1) ? datestr[str + 's'] : datestr[str]);
	}

	/* 格式化日期,来自Gadget-Navigation popups
	 * 格式化毫秒(时间戳差值)为人可读的玩意 */
	function formatAge(age) {
		var blank_str = "";
		// coerce into a number
		var a = 0 + age,
			aa = a;

		var seclen = 1000;
		var minlen = 60 * seclen;
		var hourlen = 60 * minlen;
		var daylen = 24 * hourlen;
		var weeklen = 7 * daylen;

		var numweeks = (a - a % weeklen) / weeklen;
		a = a - numweeks * weeklen;
		var sweeks = addunit(numweeks, 'week');
		var numdays = (a - a % daylen) / daylen;
		a = a - numdays * daylen;
		var sdays = addunit(numdays, 'day');
		var numhours = (a - a % hourlen) / hourlen;
		a = a - numhours * hourlen;
		var shours = addunit(numhours, 'hour');
		var nummins = (a - a % minlen) / minlen;
		a = a - nummins * minlen;
		var smins = addunit(nummins, 'minute');
		var numsecs = (a - a % seclen) / seclen;
		a = a - numsecs * seclen;
		var ssecs = addunit(numsecs, 'second');

		if (aa > 4 * weeklen) {
			return sweeks;
		}
		if (aa > weeklen) {
			return sweeks + blank_str + sdays;
		}
		if (aa > daylen) {
			return sdays + blank_str + shours;
		}
		if (aa > 6 * hourlen) {
			return shours;
		}
		if (aa > hourlen) {
			return shours + blank_str + smins;
		}
		if (aa > 10 * minlen) {
			return smins;
		}
		if (aa > minlen) {
			return smins + blank_str + ssecs;
		}
		return ssecs;
	};
	var currTime = new Date().getTime(); //当前时间
	var chstimeOffset = 480; //中国时间,8个小时=480秒
	var gettimestamp = adjustDate(getDateFromTimestamp(timestamp), chstimeOffset)
	var age = currTime - gettimestamp;
	return formatAge(age); //返回字符串
};

/* 重定向的工厂，为了同时载入 放在这里寄放，这里就像个地点 */

function Redirect() { //工厂制造
	this.date = {}; //这是部件构造
};

/* 重定向部件，第一次尝试结构化 */
Redirect.prototype = { //零件构建
	/* 重定向部件的结构 
	 * date[标题]=重定向对象
	 * 不允许[标题=重定向]区分大小写，[重定向等于空]
	 * 不考虑是否一致等情况
	 */
	// date: new Object(),  //重定向的保存数组，会被初始化

	/* 内部使用，检查是否存在键值 
	 * 存在返回true，不存在返回false
	 * 就像是 !!object
	 */
	check: function(from) {
		return (this.date[from] !== undefined); //返回是否未定义
	},
	/* 格式化/符号-看起来没有必要，因为它自己会归纳 */
	esc: function(str) {
		return str.replace("\\", "\\\\");
	},
	/* 初始化一切玩意 */
	init: function() {
		this.date = {}; //这里看起来如果操作原型的话就不同属性了__prototype_啥子的
	},
	/* 推入重定向
	 * 如果原始存在，那就更新重定向
	 */
	push: function(from, to) {
		if (to == "" || from == "") { //无效值
			//清空记录的重定向？
			return false; //一致没必要送入
		} else if (from == to) //已经一致了，抛弃所有的，要么就重写，抛弃比较好
		{
			this.remove(from);
			return true; //已经被抛弃
		}
		this.date[from] = to; //直接的送入，和上次一样也不管了
		/* 这里就是长效化的圣地了 */
		return true;
	},
	/* 移除重定向 */
	remove: function(from) {
		if (!this.check(from)) //不存在，看起来这个判断是可以行的，因为有依赖数组
		{
			return false; //本来不存在，但是得到了想要的
		}
		return delete this.date[from]; //返回删除
	},

	/* 推出重定向 
	 * 如果获得不到，那么返回原来一样的
	 */
	pull: function(from) {
		if (!this.check(from)) //不存在，返回原来的
		{
			return from;
		}
		return this.date[from]; // 无效不会存入，所以不太担心 
	}

} //部件构造结束