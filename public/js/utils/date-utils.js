/**
 * 日期工具类
 **/
Date.prototype.format = function(str){
    var d = {
        Y: this.getFullYear(),
        y: this.getFullYear(),
        M: this.getMonth()+1,
        d: this.getDate(),
        H: this.getHours(),
        h: this.getHours()%12,
        m: this.getMinutes(),
        s: this.getSeconds(),
        S: this.getMilliseconds()
    };
    for(k in d){
        var re = new RegExp('('+k+'+'+')');
        var v;
        while((r=re.exec(str))!=null){
            var v = d[k].toString(10);
            while(v.length<RegExp.$1.length){
                v = '0'.concat(v);
            }
            str = str.replace(RegExp.$1, v);
        }
    }
    return str;
}