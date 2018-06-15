/**
 * 全局的异常处理
 **/
var logger = require('log4js').getLogger("exception-filter");
var respUtils=require("../utils/resp-utils");


/**
 * 异常过滤器
 **/
function exceptionFilter(err,req,res,next) {
    logger.error(err);

    if (err.code === 'LIMIT_FILE_SIZE') {
        respUtils.errResonse(res,"不能上传超过1M的文件");
        return
    }

    if (typeof err == "string") {
        return respUtils.errResonse(res,err);
    }


    if (typeof err == "object"){
        let errMsg=err.message || err.errmsg || err.error;
        if (errMsg) {
            return respUtils.errResonse(res,errMsg);
        }
        return respUtils.errResonse(res,"服务器错误");
    }
}



module.exports=exceptionFilter;
