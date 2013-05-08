var currentRequest = null; //当前请求
var site_url = "http://see.sl088.com"; //请求站点
var freeze_flag = false; //冻结更新

/* 调试配置 */
isdebug = false; //网络调试
isdebug_fonts_fix = false; //字体调试

/* 工厂声明 */
var fonts_fix;
var redict_list

/* 常规性配置
 * 可以量化为object？
 * 支持array方式？多种匹配？
 */
var suffix_copy = ".c"; //从标题复制文本
var suffix_help = ".?"; //提供帮助信息
var suffix_edit = "+"; //前缀编辑模式
var suffix_edit_ime = "＋"; //前缀编辑模式，全角模式，todo
var suffix_edit_newtab = "++"; //前缀编辑模式、新窗口，它似乎依赖于前者
var suffix_edit_newtab_oldway = "+n"; //前缀编辑模式、新窗口，它似乎依赖于前者，备用方式
var suffix_search = "."; //从标题到达文本，如果回退到.那么又是继续搜索，锁定使用
var suffix_search_ime = "。"; //输入法生成的全角也认
var suffix_search_fulltext = "-"; //仅搜索全部文本
//=号协定，意味着等于某些东西，不能搜索它是的，至少不能开头
var trim_edit_watchlist = "=w"; //查看监视列表，需要空格开头的w，而且仅仅是w

/* 其他配置，将来可设置 */
var need_more = true; //需要更多信息，用来过滤更多信息

/* 常规检查官-检查是否在特定的编辑模式下 
 * 返回构建：
 * isedit:是否编辑，isnew:是否新建，newtext:过滤后的文字
 */

function edit_chk(text) { //检查编辑模式
	var edit_type = {
		isedit: false, //编辑模式需要
		isnew: false, //新标签页
		newtext: text, //新的文字-传入给搜索
		isfind: false, //搜索模式
		onlytxt: false, //只搜索内容
		iscopy: false, //需要复制
		ishelp: false, //需要帮助
		Srpages: 1, //页数1，第一页开始
		iswatch: false //最近的监视列表
	}; //返回构造

	if (str_chklast(text, suffix_help)) { //当前标签编辑
		edit_type.ishelp = true;
		edit_type.newtext = str_getlast(text, suffix_help.length).str; //返回剩余的一部分
	} else if (str_chklast(text, suffix_copy)) { //当前标签编辑
		edit_type.iscopy = true; //设置标记
		edit_type.newtext = str_getlast(text, suffix_copy.length).str; //返回剩余的一部分
	} else if (str_chklast(text, suffix_edit_newtab)) { //不优先可能发生坏事，比如[++]小于[+]
		edit_type.isedit = true; //编辑模式
		edit_type.isnew = true; //单独的标记
		edit_type.newtext = str_getlast(text, suffix_edit_newtab.length).str; //切除
	} else if (str_chklast(text, suffix_edit)) { //当前标签编辑
		edit_type.isedit = true; //设置标记
		edit_type.newtext = str_getlast(text, suffix_edit.length).str; //返回剩余的一部分
	} else if (str_chklast(text, suffix_edit_newtab_oldway)) { //新标签编辑，老方式
		edit_type.isedit = true; //编辑模式
		edit_type.isnew = true; //单独的标记
		edit_type.newtext = str_getlast(text, suffix_edit_newtab_oldway.length).str; //切除
	} else if (str_chklast(text, suffix_search)) { //搜索内容
		//todo:兼并联合，不需要两次
		edit_type.isfind = true; //单独的标记
		//切割获得次数
		edit_type.Srpages = str_getlastbytimes(text, suffix_search).times; //获得需要的页数，最小是1
		edit_type.newtext = str_getlastbytimes(text, suffix_search).str; //切除次数外的
	} else if (str_chklast(text, suffix_search_ime)) { //全角搜索内容
		edit_type.isfind = true; //单独的标记
		//切割获得次数
		edit_type.Srpages = str_getlastbytimes(text, suffix_search_ime).times; //获得需要的页数，最小是1
		edit_type.newtext = str_getlastbytimes(text, suffix_search_ime).str; //切除次数外的
	} else if (str_chklast(text, suffix_search_fulltext)) { //仅搜索内容
		edit_type.isfind = true; //寻找模式
		edit_type.onlytxt = true; //紧紧全文
		edit_type.newtext = str_getlast(text, suffix_search_fulltext.length).str; //切除
	}else if (str_chklast(text, trim_edit_watchlist)) //监视列表在这里
	{
		//如果是"[=w]作为开头
		edit_type.iswatch = true;//监视列表
		edit_type.newtext = str_getlast(text, trim_edit_watchlist.length).str
	}

	return edit_type; //返回构建
}

/* 输入变动 
 * 这是一切工作的核心
 * todo：拆散化，建立子函数们一起工作
 */
chrome.omnibox.onInputChanged.addListener(function (text, send_suggest) {
	var str_new_win = "进入<url>当前海域</url>"; //新窗口的玩意？

	var edit_type; //编辑模式的玩意

	defreeze(); //解除冻结
	//停止上次事件，看起来像是做了这个
	if (currentRequest != null) {
		log("终止上次事件") //打印容易得到null
		currentRequest.onreadystatechange = null;
		currentRequest.abort();
		currentRequest = null;
	}

	//处理编辑模式字符，看起来没啥坏处
	edit_type = edit_chk(text); //检查类型，并且赋值
	text = edit_type.newtext; //文字也处理了

	/* 特殊功能模式，这里不需要更多文本，也不能重复属性，只会执行第一个 */
	if (edit_type.ishelp) { //一些帮助{
		get_help(function (results) {
			send_suggest(results); //回调输出			
		});
		return true; //离开
	}else	if (edit_type.iscopy) //复制模式
	{
		if (text.length == 0) {
			put_info("<url>发现了[.c]</url>,看起来需要得到见识链接,但是<url>没有任何线索</url>给予,噢见鬼！");
		} else {
			make_copy_text = "[[" + text + "]]";
			put_info("<url>发现了[.c]</url>,看来需要得到见识链接,但未检查到<url>" + make_copy_text + "</url>拥有完全匹配,将不复制");
		}
		freeze(); //冻结显示栏
	}else	if (edit_type.iswatch)//监视列表
		{
			slboat_getwatchlist(text,function(results){
				suggest(results);
			}); //来一些最近的监视列表
			return true; //完成工作
	}

	//todo：直接放入到别的地方，或者封装到edit_type里
	if (edit_type.isnew) {
		//新的标记方式，字符串全部索引起来？
		str_new_win = "进入<url>最近的海域</url>";
	}
	if (edit_type.isedit) {
		put_info("它还不存在,现在" + str_new_win + "<url>建造</url>见识<url>[" + text + "]</url>!");
	}

	put_info("<url>直接进入</url>森亮号航海见识开始探索[<match>" + text + "</match>]");

	//重新封装一个可靠的传回去
	var suggest = function (results) {
		//处理寻找模式不需要
		if (!edit_type.isfind) {
			fonts_fix_load(); //载入字体设置-如果修改了
			if (fonts_fix.iswork) //如果在工作的话
			{
				results = ominibox_fix_desc(results); //暂时去除修理描述信息
			}
		}
		//处理掉干扰xml字串，看起来是最后的了
		results = ominibox_ecsape_xmlstr(results);
		//传出结果
		send_suggest(results);
	}

	//重定向无需初始化
	if (text.length > 0 && text != ".last" && text != "最近") { //过滤最近，但不排除无
		if (edit_type.isfind) //搜索模式
		{
			var results = []; //未来的种子
			get_search_text(text, edit_type, results, function (results) {
				suggest(results); //搜索建议释放
			}, false); //非最后一次
		} else { //非搜索模式
			get_suggest(text, edit_type, str_new_win, function (results, org_data) { //原始数据为一个字串表
				if (need_more && issth(org_data)) //需要更多信息，提醒应该换换，有得到原始字串
				{
					get_more_info(text, edit_type, str_new_win, results, org_data, function (results) {
						suggest(results); //传回最终研究内容
					}); //呼叫下一回合
				} else {
					suggest(results)
				}; //传回建议的内容
			});
		}
	} else { //直接现实最近的
		//todo: [last]也支持如何
		slboat_getrecently(function (results) {
			suggest(results); //闭包回来处理
		});
	} //最终结束
});

/* 获得全文搜索建议
 * 传入原始字串，只搜索标题，上次的结果-递归
 * 回调搜索建议
 * 它将会很酷
 * todo:如果错误，尝试丢回上一次信息
 * todo:清理掉search_text，这个落后的玩意
 */

function get_search_text(text, edit_type, results, callback, lastsearch) {
	var near_str = ""; //接近提示
	var page_info = ""; //页面信息
	var pages = edit_type.Srpages; //页数，1开始
	var has_next_page = false; //没有下一页
	//超过一页，不搜索标题先了
	if (pages > 1) {
		search_text = true;
	} else {
		//进行必要的搜索反转
		if (!lastsearch) {
			//非最后一次搜索，原始一样
			search_text = edit_type.onlytxt;
		} else {
			search_text = !edit_type.onlytxt;
		} //反转搜索
	}
	if (search_text) {
		strwhat = "text";
		near_str = "\t  <url>--></url><dim>见识接近内容:</dim>";
	} else {
		strwhat = "title"; //标题好的
		near_str = "\t  <url>--></url><dim>见识接近标题:</dim>";
	}

	if (pages == 1) { //第一页可能包含标题，第二页是纯粹的内容
		prefix = "所有入口处<url>(也探索标题)</url>...";
		page_info = printf("当前探索到%s", prefix);
	} else if (pages == 2) { //第一页可能包含标题，第二页是纯粹的内容
		prefix = "内容入口处<url>(不探索标题)</url>...";
		page_info = printf("当前探索到%s", prefix);
	} else {
		page_info = "当前探索到第" + pages + "页";
		prefix = "深入的<url>第" + pages + "页</url>...";
	}

	put_info("正在深入探索....[<match>" + text + "</match>]"); //发绿？

	var req_url = site_url + "/w/api.php?action=query&list=search&format=json&srlimit=5&srsearch=" + encodeURIComponent(text);
	req_url += "&srwhat=" + strwhat; //搜索类型
	req_url += "&srnamespace=0%7C12"; //支持主要命名空间、帮助命名空间
	if (pages > 2) { //第二页开始切换
		req_url += "&sroffset=" + pages * 5; //搜索页数，每页五项
	}
	//开始呼叫
	currentRequest = get_json(req_url, function (data) { //处理返回的json如何处置
		log("搜索得到了", data);
		if (data["query-continue"] !== undefined) //拥有下一页的玩意
		{
			has_next_page = true; //还有更多页
			page_info += printf(",探索到还有<dim>[第%s页]</dim>", (pages + 1));
		}
		var search_result = data.query.search; //返回结果
		//开始释放结果
		for (var index = 0; index < search_result.length; index++) //递归啊，建造啊
		{
			title_get = search_result[index].title; //标题好吗，模糊标题一样
			diff_info = slboat_get_match(search_result[index].snippet); //匹配内容
			if (diff_info.length < 1) //没有过多信息
			{
				//通常的它们会混在一起
				if (str_is_about_same(text, title_get)) //一致化了 
				{
					normal_list.push(text, title_get); //送入规格化信息
					diff_info = "<dim>我没看错的话!它们是完全一样的!</dim>"
				} else
					diff_info = "<dim>它被不幸的找到了!尽管没有找到过多线索!</dim>";
			}
			var desc_title = title_get;
			if (edit_type.isfind)
			{
				desc_title=ominibox_package_desc_title(title_get); //搜索模式封装，它是单独的
			}
			//push入数据，它是个数组，实际上
			results.push({
				content: title_get, //这是发送给输入事件的数据，如果和输入一样，不会被送入，看起来就是新的建议啥的
				description: desc_title + near_str + diff_info //这是描述
			});
		}
		if (!lastsearch && search_result.length < 5 && pages == 1) //结果不足，只是在第一页
		{
			//递归
			get_search_text(text, edit_type, results, callback, true);
		} else { //会有结果吗

			if (results.length == 0) //没有任何结果
			{
				put_info(printf("%s探索不到更多信息,你可以<url>直接进入</url>航海见识探索[<match>%s</match>]", [prefix, text])); //发绿？

				results.push({
					content: "nothing i got", //这是发送给输入事件的数据，如果和输入一样，不会被送入，看起来就是新的建议啥的
					description: printf("<dim>探索不到</dim>\t   关于<url>%s</url>我即便深入探索也<url>啥都没发现</url>,试试<url>[模糊*]</url>替换字符?", text) //这是描述
				});
			} else { //获得了不少结果
				put_info(printf("这是深入探索[<url>%s</url>]获得的发现...%s", [text, page_info])); //发绿？
			}

			callback(results); //回调回去
			return true; //回调函数的返回只能起个截止作用-不再往下面工作
		}

	}); //回调结束
}

/* 获得标题匹配见识
 * 传入原始字串，标题特征，回调函数
 * 回调建议结果，标题序列
 * 最基础的变动匹配
 * 它可能会很长
 */

function get_suggest(text, edit_type, str_new_win, callback) {
	//处理增加模式
	var req_url = site_url + "/w/api.php?action=opensearch&limit=5&suggest&search=" + encodeURIComponent(text); //构造字串
	//定义当前请求函数，以便后来请求
	currentRequest = get_json(req_url, function (data) { //处理返回的json如何处置
		var results = [];
		//用于一个本地的保留备份
		result_arry = data[1]; //返回的数组，长度0就是没有结果，非全局非本地
		if (result_arry.length == 0) {
			//切换到别的方式去
			if (!edit_type.isedit) {
				put_info(printf("普通探索失败,下面是我以<url>深入的方式</url>探索出来有关<url>[%s]</url>的玩意:", text));
			}
			freeze(); //冻结
			get_search_text(text, edit_type, results, callback, false); //非最后一次
			return true; //退出，将失去一切
		}
		//这是每一个结果的处置
		for (var index = 0; index < result_arry.length; index++) { //处理第一项
			var title_get = result_arry[index]; //处理这个玩意
			if (str_is_about_same(title_get, text)) //完全匹配-除了大概一样
			{
				//一致提醒
				if (edit_type.isedit) {
					put_info("探索到了!" + str_new_win + "<url>重新</url	>见识<url>[" + title_get + "]</url>!"); //处理不一致的文字
				} else if (edit_type.iscopy) { //复制模式，最终效验
					make_copy_text = "[[" + title_get + "]]";
					copy_text(make_copy_text);
					defreeze(); //临时解冻
					put_info("已探索到<url>[.c]</url>是个完全匹配的见识,已经将处理后的<url>" + make_copy_text + "</url>送到剪贴板...");
					freeze(); //继续冻结
				} else {
					put_info("噢!太好了!探索到存在<url>[" + title_get + "]</url>的见识!前往所在地吗?");
				};

				normal_list.push(text, title_get); //送入规格化信息
			}
			var match_str = ominibox_get_highline(title_get, text);
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

/* 获得进一步信息，更进一步 
 * 传入键入字符，新窗口标记，编辑类型（用于标记重定向），初步获得见识信息，原始标题序列，回调结果函数
 * 回调输出结果-标准格式
 */

function get_more_info(text, edit_type, str_new_win, faild_results, result_arry, callback) {
	//todo: 增加提醒信息？堆栈保存上次的，然后再恢复？
	//等待更深一步探索
	var has_same_title = false; //有完全匹配标题的项目
	var titles_all = result_arry.join("|"); //拼凑字符串，用于标题
	var req_url = site_url + "/w/api.php?action=query&prop=categories&format=json&cllimit=5&redirects&indexpageids&titles=" + encodeURIComponent(titles_all);
	var onfaild = function (e) //如果发生了错误
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
				//转录重定向列表，一份随意而又庞大的表
				redict_list.push(title_redirect.from, title_redirect.to);
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
			var match_str = ominibox_get_highline(title_get, text); //匹配标题
			var def_show_info = match_str + "\t       <dim>-->"; //默认标题信息
			var show_info = def_show_info; //探索进一步的信息串
			//todo，匹配信息
			if (issth(titles_arr[title_get]) && titles_arr[title_get].to != "") //检查重定向
			{
				should_get = titles_arr[title_get].to; //指向重定向
				show_info += printf("被指引!它将带到<url>[%s]</url>!\t", should_get);
				if (str_is_about_same(title_get, text)) //如果默认就有重定向，忽视大小写
				{
					if (edit_type.isedit) {
						put_info("探索到了!但它去往<url>被指引</url>," + str_new_win + "<url>重新</url	>见识<url>[" + should_get + "]</url>!"); //处理不一致的文字
					} else {
						put_info("噢!太好了!探索到存在,只是<url>被指引</url>去了<url>[" + should_get + "]</url>的见识!前往所在地吗?");
					}
					has_same_title = true; //有完全匹配了
					//只是你可能输入错误的重定向，将来将首先从正常化获得，再检查重定向
					//redict_list.push(title_redirect.from,title_redirect.to);
				}
			} else { //如果有必要清理重定向
				redict_list.remove(title_get); //清除重定向，不再有了
			}
			//处理分类
			if (issth(titles_arr[should_get]) && titles_arr[should_get].kat != "") //拥有一些玩意
			{
				show_info += "见识位于分类<url>" + titles_arr[should_get].kat + "</url>";
			}
			if (show_info == def_show_info) { //没有探索到
				show_info += "存在于在航海见识\t但是看起来没有<url>被分类</url>" //这是描述
			}
			show_info += "</dim>"; //匹配结束
			if (title_get == text) { //完全一样会不显示
				title_get += "_"; //加一个无关紧要的进去
			}
			/* 构建最终返回字串 */
			results.push({
				content: title_get, //无所谓传入老的，因为新的会再次更新
				description: show_info //这是描述
			});
		}
		//处理是否需要再次提交
		if (result_arry.length < 2 && !has_same_title) //太少结果了，不到三个吧，没有完全匹配
		{
			freeze(); //冻结标题!
			//将未完成的结果传出去
			get_search_text(text, edit_type, results, callback, false); //非最后一次
		} else {
			callback(results); //提交结果，完事
			return false;
		}

	}, onfaild)
	//回调回去
}

/* 获得最近的见识 
 * 给予需要的，获得想要的
 */

function slboat_getrecently(callback) {
	put_info("输入标题来探索航海见识,而这是<url>[最近]</url>见识：");
	//todo，函数式改写，太有点混世了
	//仅获得6个，因为重复会被过除，所以如果不获得最后一次操作的话，就要多提取几次
	var req_url = site_url + "/w/api.php?action=query&list=recentchanges&format=json&rcnamespace=0&rclimit=6&rctype=edit%7Cnew";
	//获得最后一次操作，可能丢失最新的，暂时关闭
	req_url += "&rctoponly";
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

/* 获得监视列表
 * 默认进入监视列表查看页
 * 下面就是更多的玩意
 */

function slboat_getwatchlist(callback) {
	//* 访问url，默认获取6个，看起来足够了
	var req_url = site_url +"/w/api.php?action=query&list=watchlist&format=json&wllimit=6"; //初步url构建
	put_info("正在探索监视列表....你也可以直接进入你的<url>监视列表</url>"); //提醒文字

}

/* 去除一切提醒的玩意 */

function resetDefaultSuggestion() {
	chrome.omnibox.setDefaultSuggestion({
		description: ' '
	});
}

/* 释放到提醒栏
 * 如果需要输入内容，那就输入%s
 * 全局标记冻结freeze_flag开启的话，不会更新
 */

function put_info(text) {
	if (freeze_flag) {
		return false; //冻结了
	}
	//默认的只能传送文字，遗憾的
	chrome.omnibox.setDefaultSuggestion({
		description: text
	});
	return true; //释放了
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
	if (typeof (onerror) == "function") //如果是函数
	{
		errhand = onerror;
	} else {
		errhand = put_error;
	}
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
 * 实际上只要tab.id看起来就够了
 */

function tab_go(url) {
	if (isdebug) {
		log("设置为不进入标签，页面为：", url)
		return false; //不干活了
	}
	chrome.tabs.getSelected(function (tab) {
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
	var tips_title = "航海见识探索/探索提醒";
	var edit_type = edit_chk(text); //检查类型
	text = edit_type.newtext; //文字也处理了
	var edit_link = site_url + "/w/index.php?action=edit&editintro=" +
		encodeURIComponent(tips_title) + "&title="
	//处理新窗口
	if (edit_type.isnew) { //一起+那就放回去
		tab_new(edit_link + chk_redict(text)); //处理重定向

	} else if (edit_type.isedit) {
		tab_go(edit_link + chk_redict(text));

	} else {
		//正常情况下，当一样的时候让它自己跳转
		tab_go(site_url + "/w/index.php?search=" + text);
	}
});

/* 获得当前的tab，留待使用
 * 它可以获得，而且看起来并不是很疯狂
 */

function tab_getnow() {
	chrome.tabs.getSelected(function (tab) {
		log("当前的标签是:", tab); //tab.url 就是url地址了
		return tab; //返回tab
	});
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

function chk_redict(text) {
	//正常化，再重定向
	return redict_list.pull(normal_list.pull(text));
}

/* 互斥监督者，冻结提醒文字变动 */

function freeze() {
	//冻结信息提示
	freeze_flag = true;
}

/* 互斥监督者，解除冻结提醒文字变动 */

function defreeze() {
	freeze_flag = false;
}

/* 最无用的家伙
 * 显示一些帮助
 */

function get_help(callback) {
	//可能不是及时更新，切当看看
	put_info('欢迎使用森亮号航海见识探索,下面是<url>航海见识探索</url>的一些认知执行操作:');
	var results = []; //初始化提醒
	//编辑模式
	results.push({
		content: "简单匹配.?", //更细致的？哦不。。
		description: "<dim>简单匹配</dim>    <url>[(见识标题的一部分)" + "]</url>:从头开始模糊匹配,如果<url>探索不充分</url>,将再从内容里继续匹配"
	});
	//编辑模式
	results.push({
		content: "编辑模式.?", //更细致的？哦不。。
		description: "<dim>编辑模式</dim>    <url>[(见识标题)" + suffix_edit + "]</url>:当前窗口编辑\t   \t<url>[(见识标题)" + suffix_edit_newtab + "],[(见识标题)" + suffix_edit_newtab_oldway + "]</url>:附近窗口编辑 "
	});
	//搜索模式
	results.push({
		content: "搜索模式.?", //更细致的？哦不。。
		description: "<dim>搜索模式</dim>    <url>[(见识标题)" + suffix_search + "]、全角[" + suffix_search_ime + "]</url>:从标题搜向文本\t   \t<url>[(见识标题)" + suffix_search_fulltext + "]</url>:仅仅搜索见识正文"
	});
	//搜索模式
	results.push({
		content: "别的玩意.?", //更细致的？哦不。。
		description: "<dim>别的玩意</dim>    <url>[(见识标题)" + suffix_copy + "]</url>:复制见识标题\t   \t<url>[(见识标题)" + suffix_help + "]</url>:提供本帮助信息而已"
	});
	//去往主页
	results.push({
		content: "航海见识探索", //更细致的？哦不。。
		description: "<dim>去往巢穴</dim>   <url>[航海见识探索]</url>:选择我, 去往我的孵育地.....\t  \t以及还有<url>[ ],[.last],[最近]</url>:获得最近的见识"
	});
	//别的玩意
	callback(results); //返回
	return true;
}

/* load执行事件 */
window.onload = function () {
	//window 得到全局变量，不加var也是（隐性）
	// 开始生成值在这里
	window.fonts_fix = new Fonts_fix(); //默认不赋值，后期自己去处理
	/* 生产两个工厂 */
	window.redict_list = new Redirect(); //工厂：重定向缓存列表
	window.normal_list = new Redirect(); //工厂：一个正常化表
}

/* 有了工厂又做下面的事情... */

/* 初始化字体宽度修补的玩意 */

function fonts_fix_load() {
	localStorage.font_type = localStorage.font_type || "none"; //未定义的话
	fonts_fix.set(localStorage.font_type); //保存设置
}