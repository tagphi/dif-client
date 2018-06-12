/**
 *  【字符串处理工具】
 **/

var stringUtils = {
    isEmpty(data) { //是否为空字符串
        if (!data) return true;
        return false;
    },
    isShorter(data, expectMin) { //长度是否小于指定值
        if (expectMin < 0)
            throw  new Error("长度值不能小于0");
        if (this.isEmpty(data)) return true;
        if (data.length < expectMin) return true;
        return false;
    },
    isLonger(data, expectMax) { //长度是否长于
        if (expectMax < 0)
            throw  new Error("长度值不能小于0");
        if (this.isEmpty(data)) return false;
        if (data.length > expectMax) {
            return true;
        }
        return false;
    },
    isLengthBetween(data, min, max) { //判断长度是否在指定区间
        if (min >= max)
            throw  new Error("min不能大于max");
        if (!this.isShorter(data, min) && !this.isLonger(data, max)) {
            return true;
        }
        return false;
    }

}


module.exports = stringUtils;