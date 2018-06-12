'use strict';

var errResonse = function(res, msg) {
    var response = {
        success: false,
        message: msg
    };

    res.json(response);
}


/**
 * 成功的响应
 *
 * @param res {HttpRequest} 请求对象
 * @param msg {String} 描述消息
 * @param data {Object} 数据对象或数组
 *
 **/
var succResponse=function(res,msg,data){
    var respData={
        success:true,
        message:msg,
    }
    if (data) {
        respData.data=data;
    }

    res.json(respData);
}

exports.errResonse = errResonse;
exports.succResponse = succResponse;