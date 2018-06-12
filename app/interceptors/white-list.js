/**
 *  【不受token保护的白名单】
 **/

//无需受token保护的白名单
var whiteList=['/auth/login',"/resources"];

/**
 *  判断是否是白名单中的
 **/
function isInWhiteList(url) {
    if (!url) return false;

    //遍历白名单
    let len=whiteList.length;
    for (let i = 0; i < len; i++) {
        if (url.indexOf(whiteList[i])>=0){
            return true;
        }
    }
    return false;
}


exports.whiteList=whiteList;

exports.isInWhiteList=isInWhiteList;