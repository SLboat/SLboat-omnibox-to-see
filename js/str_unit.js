/* 字符串处理的子函数们，它们为字符串而生 */

/* todo,匹配一个尾巴是否一致的函数

/* 匹配尾部字符是否一致，并进行切割
 * 送入原始字符，匹配字符
 * 返回: 布尔值，判决结果
*/
function str_chklast(text,last){
	//如果是正则表达式方式，从尾部匹配开始，计算是否有效匹配获得
	if (last.length > 0) //有传入
	{
		return (str_getlast(text,last.length).last==last) //匹配送回去有效
	}
	return false;
}

/* 获得最后的字符，如果没有长度就获得最后一个
 * 返回：
 * result.last: 最后字符
 * result.str: 切除尾巴后的字符
 */
function str_getlast(text,how_long) {
	if (typeof(how_long) == "undefined")
	{
		how_long=1; //未指定赋予1
	}
	if (text.length > 0) {
		return {
			"last": text.substr(text.length - how_long, how_long), //切断尾部
			"str": text.substr(0, text.length - how_long)
		}; //返回一个原型包含位置和长度
	}
	return null; //送回一个空，不介意吧，不算太好的主意
}

/* 大写首字母的，别的的不变
 * 返回带大写的首字母
 */
function str_up1letter(text){
	return text.charAt(0).toUpperCase()+text.substr(1,text.length);
}