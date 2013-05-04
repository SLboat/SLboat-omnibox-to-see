/* 初始化字体库 
 * type为字体信息 0是等宽，1是雅黑，2是tahoma
 * 等宽的为：比如宋体黑体GB2312这些，宋体一家（仿宋新宋）都等宽的
 * 雅黑为win7，或者xp修改字体，或者mac下的默认字体
 * tahoma（它后妈）看起来就是改版的xp主题里用这个
 */

function Fonts_fix(type){
	this.font_tp = type;  

/* Const - Font
 * 这里储存字体相关的信息
 * 等宽体直接返回真实长度就行
 * 雅黑的话一个字是19 一个空格是6
 * char_px_yh是雅黑的字库
 * char_px_th是tahoma的字库
 * 无法照顾到所有的字体 - 这很恐怖
 * 但是还是疯狂的去做了
 */
this.char_px_yh={A:13,B:12,C:13,D:14,E:10,F:10,G:14,H:15,I:6,J:8,K:12,L:10,M:19,N:15,O:15,P:12,Q:15,R:12,S:11,T:11,U:14,
						V:13,W:19,X:12,Y:11,Z:12,a:11,b:12,c:10,d:12,e:11,f:7,g:12,h:12,i:5,j:7,k:10,l:5,m:18,n:12,o:12,p:12,q:12,r:6,s:9,t:7,u:12,v:10,w:15,x:10,
						y:10,z:9,0:11,1:11,2:11,3:11,4:11,5:11,6:11,7:11,8:11,9:11, //下面是特殊符号们
						" ":6,"!":6,"\"":8,"#":12,"$":11,"%":17,"&":17,"'":5,"*":9,"+":14,"-":8,".":5,"/":8,":":5,";":5,"<":14,
						"=":14,">":14,"?":9,"@":20,"[":6,"\\":8,"]":6,"^":14,"_":9,"`":6,"{":6,"|":5,"}":6,"~":14 }

 //哇哦有够长的 - 还有一份
this.char_px_th={A:10,B:10,C:10,D:12,E:10,F:9,G:12,H:12,I:6,J:7,K:10,L:8,M:14,N:12,O:12,P:9,Q:12,R:11,S:10,T:10,U:11,
						V:10,W:16,X:10,Y:10,Z:10,a:9,b:10,c:8,d:10,e:9,f:5,g:10,h:10,i:3,j:5,k:8,l:3,m:15,n:10,o:9,p:10,q:10,r:6,s:7,t:5,u:10,v:8,w:13,x:8,
						y:8,z:7,0:9,1:9,2:9,3:9,4:9,5:9,6:9,7:9,8:9,9:9}

/* 等待压缩进入 */
this.char_px_th[' ']=5; //Tahoma的字符
this.char_px_th['@']=16;
this.char_px_th['!']=5;
this.char_px_th['?']=8;
this.char_px_th['+']=13;
this.char_px_th['=']=13;
this.char_px_th['-']=6;
this.char_px_th['#']=13;
this.char_px_th['$']=9;
this.char_px_th['%']=18;
this.char_px_th['^']=13;
this.char_px_th['&']=12;
this.char_px_th['*']=9;
this.char_px_th['\\']=6;
this.char_px_th['/']=6;
this.char_px_th['`']=9;
this.char_px_th['.']=5;
this.char_px_th['<']=13;
this.char_px_th['>']=13;
this.char_px_th[':']=6;
this.char_px_th[';']=6;
this.char_px_th['_']=10;
this.char_px_th['\'']=3;
this.char_px_th['"']=7;
this.char_px_th['~']=13;
this.char_px_th['[']=6;
this.char_px_th[']']=6;
this.char_px_th['|']=6;
this.char_px_th['{']=8;
this.char_px_th['}']=8; //终于结束了 - 更多的字体伤不起

}
/* 计算出字符串的实际长度
 * 应用字体后的长度
 * 返回的值是大致相当于多少空格
 */
Fonts_fix.prototype = {
    len: function(str) {
        str = str.replace(/<\/?match>/g, "");//处理match标签，在这里
        var len = 0;
        if (this.font_tp == 1) {
            for (var i = 0; i < str.length; i++) {
                len += this.char_px_yh[str[i]] || 19; //是的 - 雅黑汉字19px 空格6px 要的只是最终的一个倍数
            }
            len = Math.floor(len % 6 > 3 ? len / 6 + 1 : len / 6); //意外的简单
        } else if (this.font_tp == 2) {
            for (var i = 0; i < str.length; i++) {
                len += this.char_px_th[str[i]] || 17;
            }
            len = Math.floor(len % 5 > 2 ? len / 5 + 1 : len / 5); //唔 另外的一个数据 大体结构已经有了 - 不需要改变太多
        } else {
            len = str.match(/[^ -~]/g) == null ? str.length: str.length + str.match(/[^ -~]/g).length; //等宽字体?
        }
        return len;
    },

    /* 把字符串加上空格
	 * 是的看起来很困难 但是完成了
	 * 返回这个字符串
	 */
    fix: function(str, blanks) {
        for (var i = 0; i < blanks - this.len(str); i++) {
            str += " "; //是的很笨 - 但是我不知道怎么做
        }
        return str;
    }
	

} //方法封装完毕
