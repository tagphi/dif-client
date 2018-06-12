/**
 * 黑名单模块控制器
 **/

var respUtils = require("../utils/resp-utils");
var logger = require('log4js').getLogger("blacklist-controller");
let csvHelper = require("../utils/csv-helper");
let asyncWrapper=require("express-async-wrapper");

//链码调用
var invokeChaincode = require("../cc/invoke");
var queryChaincode = require("../cc/query").query;


var blacklistController= {
    BASE_ROUTE:"/blacklist",

    /**
     * 上传黑名单
     **/
    async uploadBlacklist(req, res, next) {
        //格式化数据
        let tmpPath = req.file.path;
        let type=req.body.type;
        let formattedData = csvHelper.csvToFormattedStr(tmpPath);

        // 调用链码上传名单
        let result = await invokeChaincode("deltaUpload", [formattedData,type]);
        respUtils.succResponse(res, "上传成功");
    },

    /**
     * 合并黑名单
     **/
    async mergeBlacklist(req, res, next) {
        let type = req.body.type;
        let result = await invokeChaincode("merge", [type]);
        respUtils.succResponse(res, "合并成功", result);
    },

    /**
     * 下载黑名单
     **/
    async downloadBlacklist(req, res, next) {
        let type = req.body.type;
        let result = await queryChaincode([type], "getMergedList");
        respUtils.succResponse(res, "获取成功", result);
    },

    /**
     *获取上传历史
     **/
    async uploadHistories(req, res, next) {
        // let startTimestamp=req.body.startTimestamp;
        // let endTimestamp=req.body.endTimestamp;
        let date = new Date();

        date.setDate(date.getDate() - 1);
        let startTimestamp = date.getTime().toString();

        date.setDate(date.getDate() + 2);
        let endTimestamp = date.getTime().toString();

        let result = await queryChaincode([startTimestamp, endTimestamp], "listDeltaUploadHistory");
        respUtils.succResponse(res, "获取成功", result);
    },
}

module.exports = blacklistController;