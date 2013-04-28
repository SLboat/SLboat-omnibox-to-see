/* 字符串处理的子函数们，它们为字符串而生 */
/* todo,匹配一个尾巴是否一致的函数

/* 匹配尾部字符是否一致，并进行切割
 * 送入原始字符，匹配字符
 * 返回: 布尔值，判决结果
*/

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

function str_getlast(text, how_long) {
	if (typeof (how_long) == "undefined") {
		how_long = 1; //未指定赋予1
	}
	if (text.length > 0) {
		return {
			"last": text.substr(text.length - how_long, how_long), //切断尾部
			"str": text.substr(0, text.length - how_long)
		}; //返回一个原型包含位置和长度
	}
	return {
		"last": "",
		"str": ""
	}; //送回一个空，不介意吧，不算太好的主意
}

/* 大写首字母的，别的的不变
 * 返回带大写的首字母
 */

function str_up1letter(text) {
	return text.charAt(0).toUpperCase() + text.substr(1, text.length);
}

/* 高亮匹配的部分-使用<match>语法
 *	传入获得的完整标题，输入的字符
 * 传回匹配串
 */

function ominibox_get_highline(title_get, text) {
	//制造高亮玩意
	var text_re = new RegExp(text, "i");
	var match_part = title_get.match(text_re);
	var match_str = title_get.replace(match_part, "<match>" + match_part + "</match>"); //高亮有的话，被处理了大小写
	return match_str;
}

/* 转换search返回的sniff的匹配字串
 * 输入原始的字串
 * 返回转换的字串
 */

function slboat_get_match(snippet) {
	var use_tag = "url"; //使用tag方式，可以用match、dim、url三个玩意
	//转换左标签
	snippet = snippet.replace(/<span class='searchmatch'>/g, "<"+use_tag+">");
	//转换右标签
	snippet = snippet.replace(/<\/span>/g, "</"+use_tag+">");
	//todo:切割长度？
	return snippet;
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
	if (typeof (date) == "undefined") {
		console.log("调试信息：", info);
	} else {
		console.log("调试信息：", info, date);
	}
	return true;
}
/* 复制文本到剪贴板里这样送出去咯 */
function copy_text(text) {
	//todo：检查些之前内容啥的
	var inkstand = document.getElementById('inkstand'); //不需要使用jQuery
	inkstand.value = text;
	inkstand.select();
	var rv = document.execCommand("copy"); //执行复制到这里
	return rv; //返回这玩意的执行
}

/* 重定向的工厂，为了同时载入 放在这里寄放，这里就像个地点 */

function Redirect(){ //工厂制造
	this.date={}; //这是部件构造
}
/* 重定向部件，第一次尝试结构化 */
Redirect.prototype={ //零件构建
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
	check: function(from){
		return (this.date[from]!==undefined); //返回是否未定义
	},
	/* 格式化/符号-看起来没有必要，因为它自己会归纳 */
	esc: function(str){
		return str.replace("\\", "\\\\");
	},
	/* 初始化一切玩意 */
	init: function(){
		this.date = {}; //这里看起来如果操作原型的话就不同属性了__prototype_啥子的
	},
	/* 推入重定向
	 * 如果原始存在，那就更新重定向 
	 */
	push: function(from,to){
		if ( to=="" || from =="" ){ //无效值或者一样值
			//清空记录的重定向？
			return false; //一致没必要送入
		}else if (from==to) //已经一致了，抛弃所有的，要么就重写，抛弃比较好
		{
			this.remove(from);
			return true; //已经被抛弃
		}
		this.date[from]=to; //直接的送入，和上次一样也不管了
		return true;
	},
	 /* 移除重定向 */
	remove: function(from){
		if (!this.check(from))//不存在，看起来这个判断是可以行的，因为有依赖数组
		{
			return false;//本来不存在，但是得到了想要的
		}
		return delete this.date(from);//返回删除
	},

	 /* 推出重定向 
	  * 如果获得不到，那么返回原来一样的
	  */
	pull: function(from){
		if (!this.check(from)) //不存在，返回原来的
		{
			return from;
		}
		return this.date[from];// 无效不会存入，所以不太担心 
	}
 
 }//部件构造结束

/* 生产两个工厂 */
var redict_list = new Redirect(); //工厂：重定向缓存列表
var normal_list = new Redirect(); //工厂：一个正常化表