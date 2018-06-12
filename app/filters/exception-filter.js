/**
 * 全局的异常处理
 **/
var logger = require('log4js').getLogger("exception-filter");
var respUtils=require("../utils/resp-utils");


/**
 * 异常过滤器
 **/
function exceptionFilter(err,req,res,next) {
    if (err.code === 'LIMIT_FILE_SIZE') {
        respUtils.errResonse(res,"不能上传超过1M的文件");
        return
    }

    logger.error(err);
    return respUtils.errResonse(res,"服务器错误");
}



module.exports=exceptionFilter;
