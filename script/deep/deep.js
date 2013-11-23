var THE_GREAT_REQUEST_WORKER = null; //当前请求
var CONFIG_SITE_URL = "http://see.sl088.com"; //请求站点
var FLAG_FREEZE_ME = false; //冻结更新

/* 早送回,非常取决于Chrome的支持情况,目前在Chrome V31看起来工作的很好 */
var FLAG_GET_BACK_BY_EARLY = true; //是否中途送回一次结果

/* 命名空间支持 
 * 支持主要命名空间、帮助命名空间，以及主要的讨论空间, 想法空间..
 */
var WORK_FOR_NAMESPACES = "0|1|12|430|666";

/* 调试配置
 * 快速开启一般调试: logme();
 */
isdebug = false; //网络调试
isdebug_fonts_fix = false; //字体调试

/* 工厂声明 */
var fonts_fix;
var redict_list

/* 常规性配置
 * 可以量化为object？
 */
//todo: 支持array方式？多种匹配？或许是支持|分割模式，在字符串处理的时候进行匹配！
//          或者就["+",".c"]，这样好了:)，单个的时候也支持就像printf
var suffix_copy = ".c"; //从标题复制文本
var suffix_help = ".?"; //提供帮助信息
var suffix_edit = "+"; //前缀编辑模式
var suffix_edit_ime = "＋"; //前缀编辑模式，全角模式，todo
var suffix_edit_newtab = "++"; //前缀编辑模式、新窗口，它似乎依赖于前者
var suffix_edit_newtab_oldway = "+n"; //前缀编辑模式、新窗口，它似乎依赖于前者，备用方式
var suffix_search = "."; //从标题到达文本，如果回退到.那么又是继续搜索，锁定使用
var suffix_search_fulltext = "-"; //仅搜索全部文本
//=号协定，意味着等于某些东西，不能搜索它是的，至少不能开头
var prefix_edit_watchlist = "=w"; //查看监视列表，需要空格开头的w，而且仅仅是w
var prefix_edit_watchlist_raw = "=wr"; //原始格式的监视列表

/* 其他配置，将来可设置 */
var need_more = true; //需要更多信息，用来过滤更多信息

/* 常规检查官-检查是否在特定的编辑模式下 
 * 返回构建：
 * isedit:是否编辑，isnewtab:是否新建，newtext:过滤后的文字
 */

function edit_chk(text) { //检查编辑模式
	var edit_type = {
		islast: false, //最近的见识
		isedit: false, //编辑模式需要
		isnewtab: false, //新标签页
		newtext: text, //新的文字-传入给搜索
		isfind: false, //搜索模式
		onlytxt: false, //只搜索内容
		iscopy: false, //需要复制
		ishelp: false, //需要帮助
		Srpages: 1, //页数1，第一页开始
		iswatch: false, //最近的监视列表
		iswatchraw: false //原始raw列表
	}; //返回构造

	//全局替换句号为点号，或许只处理最后几个字符就好了？
	text = text.replace(/。/g, ".");

	/* 临时的定制名字空间倒置写法 */
	text = slboat_replace_namespace(text, "想法");
	text = slboat_replace_namespace(text, "短英语");

	if (str_chklast(text, suffix_help)) { //当前标签编辑
		edit_type.ishelp = true;
		edit_type.newtext = str_getlast(text, suffix_help.length).str; //返回剩余的一部分
	} else
	if (text.length == 0 || text == ".last" || text == "最近") //最近见识
		edit_type.islast = true; //设置标记
	else if (str_chklast(text, suffix_copy)) { //当前标签编辑
		edit_type.iscopy = true; //设置标记
		edit_type.newtext = str_getlast(text, suffix_copy.length).str; //返回剩余的一部分
	} else if (str_chklast(text, suffix_edit_newtab)) { //不优先可能发生坏事，比如[++]小于[+]
		edit_type.isedit = true; //编辑模式
		edit_type.isnewtab = true; //单独的标记
		edit_type.newtext = str_getlast(text, suffix_edit_newtab.length).str; //切除
	} else if (str_chklast(text, suffix_edit)) { //当前标签编辑
		edit_type.isedit = true; //设置标记
		edit_type.newtext = str_getlast(text, suffix_edit.length).str; //返回剩余的一部分
	} else if (str_chklast(text, suffix_edit_newtab_oldway)) { //新标签编辑，老方式
		edit_type.isedit = true; //编辑模式
		edit_type.isnewtab = true; //单独的标记
		edit_type.newtext = str_getlast(text, suffix_edit_newtab_oldway.length).str; //切除
	} else if (str_chklast(text, suffix_search)) { //搜索内容
		//todo:兼并联合，不需要两次
		edit_type.isfind = true; //单独的标记
		//切割获得次数
		edit_type.Srpages = str_getlastbytimes(text, suffix_search).times; //获得需要的页数，最小是1
		edit_type.newtext = str_getlastbytimes(text, suffix_search).str; //切除次数外的
		if (edit_type.newtext.length == 0) {
			edit_type.islast = true; //空空的...
		}
	} else if (str_chklast(text, suffix_search_fulltext)) { //仅搜索内容
		edit_type.newtext = str_getlast(text, suffix_search_fulltext.length).str; //切除
		if (edit_type.newtext.length == 0) { //如果什么内容也没有,那何必全部检索..?
			edit_type.islast = true;
		} else { //或许不该吞掉..
			edit_type.isfind = true; //寻找模式
			edit_type.onlytxt = true; //紧紧全文		
		}
	} else if (str_chkfirst(text, prefix_edit_watchlist) || str_chkfirst(text, prefix_edit_watchlist_raw)) //监视列表在这里
	{
		if (str_chkfirst(text, prefix_edit_watchlist_raw)) //需要原始列表
		{
			edit_type.iswatchraw = true; //原始raw列表
		}
		//如果是"[=w]作为开头
		edit_type.iswatch = true; //监视列表
		edit_type.newtext = str_getfirst(text, prefix_edit_watchlist.length).str
	}

	return edit_type; //返回构建
}

/* 输入变动 
 * 这是一切工作的核心
 * todo：拆散化，建立子函数们一起工作
 */
chrome.omnibox.onInputChanged.addListener(function(text, send_suggest) {
	var str_new_win = "进入<url>当前海域</url>"; //新窗口的玩意？
	var edit_type; //编辑模式的玩意

	defreeze(); //解除冻结
	//停止上次事件，看起来像是做了这个
	if (THE_GREAT_REQUEST_WORKER != null) {
		log("终止上次事件") //打印容易得到null
		THE_GREAT_REQUEST_WORKER.onreadystatechange = null;
		THE_GREAT_REQUEST_WORKER.abort();
		THE_GREAT_REQUEST_WORKER = null;
	};

	/* 重新封装一个可靠的传回去的回传函数 */
	var suggest = function(results) {
		var final_results = obj_clone(results); //克隆一份,嘿嘿
		//处理寻找模式不需要
		if (!edit_type.isfind || edit_type.islast) {
			fonts_fix_load(); //载入字体设置-如果修改了
			if (fonts_fix.iswork()) //如果在工作的话
			{
				final_results = ominibox_fix_desc(final_results); //暂时去除修理描述信息
			};
		};
		//处理掉干扰xml字串，看起来是最后的了
		final_results = ominibox_ecsape_xmlstr_results(final_results);
		//传出结果
		send_suggest(final_results);
	};

	//处理编辑模式字符，看起来没啥坏处
	edit_type = edit_chk(text); //检查类型，并且赋值
	text = edit_type.newtext; //文字也处理了

	put_info("<url>直接进入</url>森亮号航海见识开始探索[<match>" + text + "</match>]");

	if (edit_type.isnewtab) {
		str_new_win = "进入<url>最近的海域</url>";
	};

	/* 特殊功能模式，这里不需要更多文本，也不能重复属性，只会执行第一个 */
	if (edit_type.ishelp) { //一些帮助{
		get_help(function(results) {
			send_suggest(results); //回调输出			
		});
		return true; //离开
	} else if (edit_type.iscopy) //复制模式
	{
		if (text.length == 0) {
			put_info("<url>发现了[.c]</url>,看起来需要得到见识链接,但是<url>没有任何线索</url>给予,噢见鬼！");
		} else {
			make_copy_text = "[[" + text + "]]";
			put_info("<url>发现了[.c]</url>,看来需要得到见识链接,但未检查到<url>" + make_copy_text + "</url>拥有完全匹配,将不复制");
		}
		freeze(); //冻结显示栏
	} else if (edit_type.iswatch) //监视列表
	{
		slboat_getwatchlist(text, edit_type, function(results) {
			suggest(results);
		}); //来一些最近的监视列表
		return true; //完成工作
	} else if (edit_type.isedit) {
		//默认标记...
		put_info("现在" + str_new_win + "<url>建造</url>见识<url>[" + slboat_namespace_take(text) + "]</url>!");
	}

	//重定向无需初始化
	if (!edit_type.islast) { //过滤最近，但不排除无
		if (edit_type.isfind) //搜索模式
		{
			var results = []; //未来的种子
			get_search_text(text, edit_type, results, function(results) {
				suggest(results); //搜索建议释放
			}, false); //非最后一次
		} else { //普通标题快速寻找
			moreinfo_callback = function(results, i_from_search_text) { //原始数据为一个字串表
				i_from_search_text = i_from_search_text || false; //默认关闭
				if (need_more && !i_from_search_text && !(results.length == 1 && results[0].content == "nothing i got")) //需要更多信息，提醒应该换换，有得到原始字串
				{
					if (FLAG_GET_BACK_BY_EARLY) { //提前回家
						/* 注意:这里理论上不能放置 */
						suggest(results); //试图直接丢出去,奇怪的似乎能工作
					};
					get_more_info(text, edit_type, str_new_win, results, function(results) {
						suggest(results); //传回最终研究内容
					}); //呼叫下一回合
				} else {
					suggest(results)
				}; //传回建议的内容
			};
			get_suggest(text, edit_type, str_new_win, moreinfo_callback, false, null);
		}
	} else { //直接现实最近的
		//todo: [last]也支持如何
		slboat_getrecently(edit_type, function(results) {
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
	var LOOK_FOR_TEXT = text; //搜索内容
	var I_FORM_SEARCH_TEXT = true; //作为常量好了
	var req_url = CONFIG_SITE_URL + "/w/api.php?action=query&list=search&format=json&srlimit=5"; //构建基础请求的原型,就像个孩子
	req_url += "&srnamespace=" + WORK_FOR_NAMESPACES; //工作的命名空间

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
	};

	if (search_text) {
		strwhat = "text";
		near_str = "\t  <url>--></url><dim>见识接近内容:</dim>";
	} else {
		strwhat = "title"; //标题好的
		LOOK_FOR_TEXT = slboat_namespace_take(text); //临时寄存文本内容
		near_str = "\t  <url>--></url><dim>见识接近标题:</dim>";
	};

	if (pages == 1) { //第一页可能包含标题，第二页是纯粹的内容
		prefix = "所有入口处<url>(也探索标题)</url>...";
		page_info = printf("当前探索到%s", prefix);
	} else if (pages == 2) { //第一页可能包含标题，第二页是纯粹的内容
		prefix = "内容入口处<url>(不探索标题)</url>...";
		page_info = printf("当前探索到%s", prefix);
	} else {
		//页数减少一，这里的页数真是太混乱了
		page_info = "当前探索到第" + (pages - 1) + "页";
		prefix = "深入的<url>第" + (pages - 1) + "页</url>...";
	};

	put_info("正在深入探索....[<match>" + text + "</match>]"); //发绿？

	req_url += "&srwhat=" + strwhat; //搜索类型
	if (pages > 2) { //第二页开始切换
		req_url += "&sroffset=" + (pages - 2) * 5; //搜索页数，每页五项
	};

	req_url += "&srsearch=" + encodeURIComponent(LOOK_FOR_TEXT); //最终构造完毕
	//开始呼叫
	THE_GREAT_REQUEST_WORKER = get_json(req_url, function(data) { //处理返回的json如何处置		
		log("搜索得到了", data); //日志标记
		if (data.error) { //出错了
			put_info(printf("船长!收到错误报告: %s - %s", [data.error.code, data.error.info]));
			return false; //死咯
		};
		if (data["query-continue"] !== undefined) //拥有下一页的玩意
		{
			has_next_page = true; //还有更多页
			page_info += printf(",探索到还有<dim>[第%s页]</dim>", pages);
		}
		var search_result = data.query.search; //返回结果
		//开始释放结果
		for (var index = 0; index < search_result.length; index++) //递归啊，建造啊
		{
			title_get = search_result[index].title; //标题好吗，模糊标题一样
			/* 这里返回来的结果已经做了xml处理,所以没啥可担心的 */
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
			};
			var desc_title = title_get;
			if (edit_type.isfind) {
				desc_title = ominibox_package_desc_title(title_get); //搜索模式封装，它是单独的
			};
			//hoho,亮一亮,灯点亮...
			var match_str = ominibox_get_highline_forall(title_get, text);
			//push入数据，它是个数组，实际上
			results.push({
				content: title_get, //这是发送给输入事件的数据，如果和输入一样，不会被送入，看起来就是新的建议啥的
				description: match_str + near_str + diff_info //这是描述
			});
		}
		if (!lastsearch && search_result.length < 5 && pages == 1) //结果不足，只是在第一页
		{
			if (FLAG_GET_BACK_BY_EARLY) { //提前回家
				/* 中间阶段放置一次结果 */
				callback(results, I_FORM_SEARCH_TEXT);
			};
			//递归最后一次的...
			return get_search_text(text, edit_type, results, callback, true);
		} else { //会有结果吗

			if (results.length == 0) //没有任何结果
			{
				put_info(printf("%s<url>探索不到</url>更多信息,你可以<url>直接进入</url>航海见识探索[<match>%s</match>]", [prefix, text])); //发绿？

				results.push({
					content: "nothing i got", //这是发送给输入事件的数据，如果和输入一样，不会被送入，看起来就是新的建议啥的
					description: printf("<dim>探索不到</dim>\t   关于<url>%s</url>我即便深入探索也<url>啥都没发现</url>,试试<url>[模糊*]</url>替换字符?", text) //这是描述
				});
			} else { //获得了不少结果
				put_info(printf("这是深入探索[<url>%s</url>]获得的发现...%s", [text, page_info])); //发绿？
			};
			/* 这种假常量的意义看起来就是让传入的变量好识别一些 */
			callback(results, I_FORM_SEARCH_TEXT); //回调回去
			return true; //回调函数的返回只能起个截止作用-不再往下面工作
		};

	}); //回调结束
}

/* 获得标题匹配见识
 * 传入原始字串，标题特征，回调函数
 * 回调建议结果，标题序列
 * 最基础的变动匹配
 * 它可能会很长
 */

function get_suggest(text, edit_type, str_new_win, callback, do_for_think, results) {
	/* 名字空间的定义	
	 */
	do_for_think = do_for_think || false; //为想法做一次
	var results = results || [];
	var name_space_need = "&namespace="; //目前还不工作!
	if (do_for_think) {
		name_space_need += "666"; //666,想法...
	} else {
		name_space_need += "0"; //普通空间
	};
	var LOOK_FOR_TEXT = slboat_namespace_take(text); //临时寄存文本内容
	var req_url = CONFIG_SITE_URL + "/w/api.php?action=opensearch&limit=5&suggest&search=" + encodeURIComponent(LOOK_FOR_TEXT); //构造字串
	req_url += name_space_need; //加上名字空间

	//定义当前请求函数，以便后来请求
	THE_GREAT_REQUEST_WORKER = get_json(req_url, function(data) { //处理返回的json如何处置
		//这是内部的闭包,会吸收外面的环境
		//用于一个本地的保留备份
		result_arry = data[1]; //返回的数组，长度0就是没有结果，非全局非本地
		if (do_for_think && result_arry.length == 0 && results.length == 0) { //啥也没有的话
			//切换到别的方式去
			if (!edit_type.isedit) {
				put_info(printf("普通探索失败,下面是我以<url>深入的方式</url>探索出来有关<url>[%s]</url>的玩意:", text));
			}
			freeze(); //冻结
			get_search_text(text, edit_type, results, callback, false); //非最后一次
			return true; //退出，将失去一切
		}
		//这是每一个结果的处置
		for (var index = 0; index < result_arry.length && results.length < 5; index++) { //处理第一项
			var title_get = result_arry[index]; //处理这个玩意
			if (str_is_about_same(title_get, LOOK_FOR_TEXT)) //完全匹配-除了大概一样
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
					put_info("噢!<url>太好了!</url>探索到存在<url>[" + title_get + "]</url>的见识!前往所在地吗?");
				};

				/* 暂存给进一步信息 */
				normal_list.push(LOOK_FOR_TEXT, title_get); //送入规格化信息
			}
			var match_str = ominibox_get_highline(title_get, LOOK_FOR_TEXT);
			//push入数据，只是坏情况发生的时候
			results.push({
				content: title_get, //这是发送给输入事件的数据，如果和输入一样，不会被送入，看起来就是新的建议啥的
				description: match_str + "\t       <dim>->存在于在航海见识, 但无法更深入探索</dim>" //这是描述
			});
		}
		if (do_for_think || result_arry.length > 4) { //不止有四个,那就当掉全部的
			//返回原始标题，以及结果
			callback(results); //或许还要点别的？	
		} else { //回调自己,再做一次
			/* result 结果还会在吗?-这不是回调,不会存在的 */
			return get_suggest(text, edit_type, str_new_win, callback, true, results);
		};
	}); //完成任务
}

/* 获得进一步信息，更进一步 
 * 传入键入字符，新窗口标记，编辑类型（用于标记重定向），初步获得见识信息，原始标题序列，回调结果函数
 * 回调输出结果-标准格式
 */

function get_more_info(text, edit_type, str_new_win, orgin_results, callback) {
	//todo: 增加提醒信息？堆栈保存上次的，然后再恢复？
	//等待更深一步探索
	var has_same_title = false; //有完全匹配标题的项目
	var result_arry = []; //重建结果数组
	orgin_results.forEach(function(resust) {
		result_arry.push(resust.content); //推入...
	});
	var titles_all = result_arry.join("|"); //拼凑字符串，用于标题
	/* 处于意外的情况-这里会发生更多意外 */
	if (titles_all == "nothing i got") { //如果没有数据的话
		callback(orgin_results); //传回旧的数据
		return false;
	};
	//这里不需要命名空间,不要做这种试图
	var req_url = CONFIG_SITE_URL + "/w/api.php?action=query&prop=categories&format=json&redirects&indexpageids&titles=" + encodeURIComponent(titles_all);
	//req_url += "&cllimit=" + result_arry.length; //这里应该比输入结果大..无论如何

	var onfaild = function(e) //如果发生了错误
	{
		put_info("更深入探索见识的时候发生了些意外: [" + e.message + "], 这是初步探索");
		callback(orgin_results); //传回失败的数据
		return false;
	}
	//开始解析
	THE_GREAT_REQUEST_WORKER = get_json(req_url, function(data) {
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
				var push_in = redict_list.push(title_redirect.from, title_redirect.to);
				if (push_in) {
					chrome_had_save(); //存储起来吧...
				};
			};
		};
		//给它转过去，让它飞翔
		for (page_ids in data.query.pages) {
			//这是处理的开始了
			if (page_ids > 0) //有效的话
			{
				var titles_now = data.query.pages[page_ids].title
				if (typeof(titles_arr[titles_now]) == "undefined") {
					titles_arr[titles_now] = {}; //再次初始化
				}
				titles_arr[titles_now].to = ""; //这里不再被转录
				//获得分类，唯一要紧的事
				var all_categories = data.query.pages[page_ids].categories
				titles_arr[titles_now].kat = ""; //初始化分类转录
				if (typeof(all_categories) != "undefined") {
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
			var match_str = ominibox_get_highline_forall(title_get, text); //匹配标题
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
				show_info += "\t \t <url>完全一样的见识!</url>";
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
			return get_search_text(text, edit_type, results, callback, false); //非最后一次
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

function slboat_getrecently(edit_type, callback) {
	//todo，函数式改写，太有点混世了
	var req_url = CONFIG_SITE_URL + "/w/api.php?action=query&list=recentchanges&format=json&rctype=edit%7Cnew";
	//获得最后一次操作，可能丢失最新的
	req_url += "&rctoponly"; //重复的话只要一个
	req_url += "&rcnamespace=" + WORK_FOR_NAMESPACES; //名字空间
	req_url += "&rcprop=comment%7Ctitle"; //包含属性...
	/* 处理翻页的玩意们 */
	var st_look = 0; //开始寻找的个数
	if (edit_type.isfind) { //如果是翻页模式...
		st_look = (edit_type.Srpages - 1) * 5; //根据着页来探索...
	};
	if (edit_type.isfind) { //如果是需要多页的玩意...
		put_info(printf("正在深入探索<url>[最近]</url>见识,这是[%s]页(%s-%s):", [edit_type.Srpages, st_look, st_look + 5]));
		//需要的页数x5
		limit_need = edit_type.Srpages * 5;
	} else {
		put_info("输入标题来探索航海见识,而这是<url>[最近]</url>见识：");
		limit_need = 5; //默认就要五个好了
	};
	//仅获得多少个，因为重复会被过除，所以如果不获得最后一次操作的话，就要多提取几次
	req_url += "&rclimit=" + limit_need; //需要几个结果,将来截取

	//如何移出去呢->也许在这里就很好了嘛
	THE_GREAT_REQUEST_WORKER = get_json(req_url, function(data) {
		var results = [];
		//todo：不要一次性算出两级，错误太多
		var result_arry = data.query.recentchanges; //返回的数组，长度0就是没有结果
		if (typeof(result_arry) == "undefined") {
			return false; //无效退出
		}
		//这是每一个结果的处置
		for (var index = st_look; index < st_look + 5; index++) { //只提取5个
			var title_get = result_arry[index].title; //标题
			var type_str = result_arry[index].type; //类型			
			var comment_str = result_arry[index].comment; //注释内容
			if (comment_str.length > 0) { //前置点玩意
				comment_str = ": " + ecsape_all_xmlstr(comment_str); //注释特殊字符
			};
			switch (type_str) { //重新命名编辑方式
				case "new":
					type_str = "新建";
					break; //必须跳
				case "edit":
					type_str = "编辑";
					break;
					/* 别的方式就不变咯 */
			}
			//push入数据
			results.push({
				content: title_get, //这是发送给输入事件的数据
				description: printf("%s\t       <dim>->最近%s见识</dim><url>[%s]</url>%s", [title_get, type_str, index, comment_str]) //这是描述
			});
		}
		callback(results); //提交结果，完事
	});
}

/* 获得监视列表
 * 默认进入监视列表查看页
 * 下面就是更多的玩意
 */
//todo: 下一页探索？

function slboat_getwatchlist(text, edit_type, callback) {
	//* 访问url，默认获取6个，看起来足够了
	var req_url;
	if (edit_type.iswatchraw) //raw模式
	{
		req_url = CONFIG_SITE_URL + "/w/api.php?action=query&list=watchlistraw&format=json&wrlimit=6"; //raw模式
		req_url += "&wrnamespace=0%7C2%7C4%7C6%7C8%7C10%7C12%7C14%7C274%7C1198%7C666"; //屏蔽所有讨论命名空间，暂时的不需要它
	} else {
		req_url = CONFIG_SITE_URL + "/w/api.php?action=query&list=watchlist&format=json&wllimit=6"; //初步url构建
	}
	//req_url += getatime(); //避开一些缓存，看起来避不开的是自带的玩意
	perfix_tips = "";
	if (text.length > 0) {
		//有一些别的玩意
		perfix_tips = ",探索监视列表不需要带别的";
	}
	put_info("正在探索监视列表....你也可以直接进入你的<url>监视列表</url>" + perfix_tips); //提醒文字
	THE_GREAT_REQUEST_WORKER = get_json(req_url, function(data) {
		var results = [];
		var result_arry; //结果字串

		if (!data.query && !data.watchlistraw) {
			var error_info = "";
			if (!data.error) {
				error_info = "我也不太清楚发生啥事了!";
			} else {
				error_info = printf("我想可能是因为: %s", [data.error.info]); //获得了错误信息
			}
			put_info(printf("探索<url>监视列表</url>的时候发生意外 %s", [error_info])); //印出错误信息
			return false; //再见离开
		}
		if (edit_type.iswatchraw) //raw模式
			result_arry = data.watchlistraw; //返回的数组，长度0就是没有结果	
		else {
			result_arry = data.query.watchlist; //返回的数组，长度0就是没有结果
		}
		if (typeof(result_arry) == "undefined") {
			return false; //无效退出
		}
		if (result_arry.length > 5) {
			put_info("哇喔!我不幸的探索到很多<url>监视列表</url>....这里是一些最近的玩意:"); //提醒文字
		} else {
			put_info(printf("啊哈!探索到了!我不幸的探索到只有%s个<url>监视列表</url>变动:", [result_arry.length])); //提醒文字
		}
		//这是每一个结果的处置
		for (var index = 0; index < result_arry.length; index++) { //处理第一项
			var title_get = result_arry[index].title //处理这个玩意
			//push入数据
			results.push({
				content: title_get, //这是发送给输入事件的数据
				description: title_get + "\t       <dim>->监视列表里的变化</dim><url>[" + index + "]</url>" //这是描述
			});
		}
		callback(results); //提交结果，完事
	});
}

/* 去除一切提醒的玩意 */

function resetDefaultSuggestion() {
	chrome.omnibox.setDefaultSuggestion({
		description: ' '
	});
}

/* 释放到提醒栏
 * 如果需要输入内容，那就输入%s
 * 全局标记冻结FLAG_FREEZE_ME开启的话，不会更新
 */

function put_info(text) {
	if (FLAG_FREEZE_ME) {
		return false; //冻结了
	}
	//默认的只能传送文字，遗憾的
	chrome.omnibox.setDefaultSuggestion({
		description: text
	});
	return true; //释放了
}

// 开始输入，有了第一次反应
chrome.omnibox.onInputStarted.addListener(function() {
	put_info('开始在航海见识探索吧');
	log("本次输入开始了...");
});

// 结束了输入了-发生在输入过，然后全部删除，输入了，然后离开了输入框
chrome.omnibox.onInputCancelled.addListener(function() {
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
	if (typeof(onerror) == "function") //如果是函数
	{
		errhand = onerror;
	} else {
		errhand = put_error;
	};
	req.open("GET", req_url, true);
	req.onload = function() {
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
	// req.timeout = 1000; //未来的超时设置?
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
	chrome.tabs.getSelected(function(tab) {
		chrome.tabs.update(tab.id, {
			url: url
		});
	});
}

/* 前往海域-附近海域 
 */

function tab_new(url) {
	chrome.tabs.getSelected(null, function(tab) { //这就是获得了当前的tab哦
		chrome.tabs.create({
			index: tab.index + 1, //序号+1
			url: url
		});
	});
}

/* 当：选择了一项见识里的玩意
 * 将：去往那个见识的地方
 */
chrome.omnibox.onInputEntered.addListener(function(text) {
	var tips_title = "OminiboxSee"; //修改为英文的哪种简单标题
	var edit_type = edit_chk(text); //检查类型
	var title = text; //默认的标题,用到的话
	text = edit_type.newtext; //文字也处理了
	var edit_link = CONFIG_SITE_URL + "/w/index.php?action=edit&editintro=" +
		encodeURIComponent(tips_title) + "&title=";
	//处理新窗口
	if (edit_type.islast) {
		tab_go(CONFIG_SITE_URL + "/wiki/特殊:最近更改") //进入最近更改

	} else if (edit_type.isedit || edit_type.isnewtab) { //编辑模式

		title = slboat_namespace_take(chk_redict(text));
		edit_link += chk_redict(title);
		match_namespace = slboat_namespace_take(chk_redict(text), true);

		/* 预置模板处理-如果有的话 */
		if (match_namespace == "短英语") { //如果匹配了短英语
			edit_link += "&preload=模板:短英语/预置"; //加上预置页面
		};

		if (edit_type.isnewtab) { //新标签页打开..
			tab_new(edit_link);
		} else {
			tab_go(edit_link);
		};

	} else if (edit_type.iswatch) { //监视列表
		var watch_url = CONFIG_SITE_URL + "/w/index.php?title=Special:Watchlist"; //用户的监视列表标记
		watch_url += "&days=0"; //没有限制日期
		tab_go(watch_url);

	} else {
		//正常情况下，当一样的时候让它自己跳转
		tab_go(CONFIG_SITE_URL + "/w/index.php?search=" + text);
	}
});

/* 获得当前的tab，留待使用
 * 它可以获得，而且看起来并不是很疯狂
 */

function tab_getnow() {
	chrome.tabs.getSelected(function(tab) {
		log("当前的标签是:", tab); //tab.url 就是url地址了
		return tab; //返回tab
	});
}

/* 判断是否是一些东西
 * 而不是未定义-undefined
 * todo：字符串加上自动判断""?
 */

function issth(anything) {
	return typeof(anything) != "undefined";
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
	FLAG_FREEZE_ME = true;
}

/* 互斥监督者，解除冻结提醒文字变动 */

function defreeze() {
	FLAG_FREEZE_ME = false;
};

/* 保存到Chrome本地数据库 */
function chrome_had_save() {
	chrome.storage.local.set({
		"normal_list": normal_list.date,
		"redict_list": redict_list.date,
	}, function() {
		log("本地存储了一下两份列表"); //这里是成功了
	})
};

function chrome_had_load() {
	chrome.storage.local.get(["normal_list", "redict_list"], function(items) {
		if (items.normal_list) {
			normal_list.date = items.normal_list; //赋入正常化
		};
		if (items.redict_list) {
			redict_list.date = items.redict_list; //赋入重定向
		};
		log("本地存储载入设置成功咯;");
	});
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
		description: "<dim>搜索模式</dim>    <url>[(见识标题)" + suffix_search + "]</url>:从标题搜向文本,兼容全角\t   \t<url>[(见识标题)" + suffix_search_fulltext + "]</url>:仅仅搜索见识正文"
	});
	//搜索模式
	results.push({
		content: "别的玩意.?", //更细致的？哦不。。
		description: printf("<dim>别的玩意</dim>    <url>[(见识标题)%s]</url>:复制见识标题\t   \t<url>[(见识标题)%s]</url>:提供本帮助信息而已\t   \t <url>[%s]</url>获得监视列表", [suffix_copy, suffix_help, prefix_edit_watchlist])
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
window.onload = function() {
	//window 得到全局变量，不加var也是（隐性）
	// 开始生成值在这里
	window.fonts_fix = new Fonts_fix(); //默认不赋值，后期自己去处理
	/* 生产两个工厂 */
	window.redict_list = new Redirect(); //工厂：重定向缓存列表
	window.normal_list = new Redirect(); //工厂：一个正常化表
	/* 载入读取数据 */
	chrome_had_load();
}

/* 有了工厂又做下面的事情... */

/* 初始化字体宽度修补的玩意 */

function fonts_fix_load() {
	localStorage.font_type = localStorage.font_type || "none"; //未定义的话
	fonts_fix.set(localStorage.font_type); //保存设置
}