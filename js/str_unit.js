/* 字符串子函数们 */

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