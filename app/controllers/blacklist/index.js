/**
 * 黑名单模块控制器
 **/

var respUtils = require("../../utils/resp-utils");
var logger = require('log4js').getLogger("blacklist-controller");
let csvHelper = require("../../utils/csv-helper");
let asyncWrapper = require("express-async-wrapper");
var {check} = require('express-validator/check')

let blacklistValidator = require("../../validators/blacklist-validator");

//链码调用
var invokeChaincode = require("../../cc/invoke");
var queryChaincode = require("../../cc/query");

exports.url = "/blacklist";
exports.excludeHandlers = ["uploadBlacklist","removeBlacklist", "download"];

/**
 * 上传黑名单
 **/
exports.validateUploadBlacklist = [
    check('type').not().isEmpty().withMessage('类型不能为空'),
]

exports.uploadBlacklist = async function (req, res, next) {
    //格式化数据
    // let dataStr = req.file.buffer.toString();
    let dataStr = "device1\tIMEI\tMD5\t1\ndevice2\tIMEI\tMD5\t1";
    let type = req.body.type;

    //检查数据格式
    // let err = blacklistValidator.checkDataFormat(dataStr, type);
    // if (err) return next(err);

    // 调用链码上传名单
    let result = await invokeChaincode("deltaUpload", [dataStr, type]);
    respUtils.succResponse(res, "上传成功");
}

/**
 * 移除黑名单
 **/
exports.validateRemoveBlacklist = [
    check('type').not().isEmpty().withMessage('类型不能为空'),
]

exports.removeBlacklist = async function (req, res, next) {
    //格式化数据
    // let dataStr = req.file.buffer.toString();
    let dataStr = "device1\tIMEI\tMD5";
    // let dataStr = "device1\tIMEI\tMD5\t1\ndevice2\tIMEI\tMD5\t1";
    let type = req.body.type;

    //检查数据格式
    // let err = blacklistValidator.checkDataFormat(dataStr, type);
    // if (err) return next(err);

    // 调用链码上传名单
    let result = await invokeChaincode("uploadRemoveList", [dataStr, type]);
    respUtils.succResponse(res, "上传成功");
}


/**
 * 合并黑名单
 **/
exports.validateMergeBlacklist = [
    check('type').not().isEmpty().withMessage('类型不能为空'),
]

exports.mergeBlacklist = async function (req, res, next) {
    let type = req.body.type;
    let result = await invokeChaincode("merge", [type]);
    respUtils.succResponse(res, "合并成功", result);
}

/**
 * 下载黑名单
 *
 * result 示例
 *      {"device1\tIMEI\tMD5":["RTBAsia"],"device2\tIMEI\tMD5":["RTBAsia"]}
 **/
exports.validateDownload = [
    check('isUpload').not().isEmpty().withMessage('isUpload不能为空'),
    check('key').not().isEmpty().withMessage('key不能为空'),
]

exports.download = async function (req, res, next) {
    let isUpload = req.query.isUpload;
    let key = req.query.key;

    let result =[];

    if (isUpload) { //黑名单列表
        result = await queryChaincode("getDeltaList", [key]);
    }else{ //删除列表
        result = await queryChaincode("getRemoveList", [key]);
    }

    console.log(result)

    result = JSON.parse(result.toString());

    //筛选
    let tmpResult = "";
    for (let prop in result) {
        tmpResult += prop + "\n";
    }

    res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename=' + type + new Date().getTime() + ".txt",
    });

    res.send(tmpResult);
}

/**
 *获取上传/移除历史
 *
 * result 示例
 *      "[{"timestamp":"1528929803302","mspid":"RTBAsia","type":"device","key":"\u0000ORGDELTA\u00001528929803302\u0000RTBAsia\u0000device\u0000"}]"
 **/
exports.validateHistories = [
    check('isUpload').not().isEmpty().withMessage('isUpload不能为空'),
    check('type').not().isEmpty().withMessage('类型不能为空'),
    check('startDate').not().isEmpty().withMessage('开始日期不能为空'),
    check('endDate').not().isEmpty().withMessage('结束日期不能为空'),
]

exports.histories = async function (req, res, next) {
    let type = req.body.type;
    let isUpload = req.body.isUpload;
    let startTimestamp = Date.parse(req.body.startDate) + "";
    let endTimestamp = Date.parse(req.body.endDate) + "";

    let pageNO = req.body.pageNO || 1;
    let pageSize = req.body.pageSize || 10;

    //计算偏移
    let startOffset = (pageNO - 1) * pageSize;
    let endOffset = startOffset + pageSize - 1;

    let result = undefined;

    if (isUpload){
        result = await queryChaincode("listDeltaUploadHistory", [startTimestamp, endTimestamp]);
    }else {
        result = await queryChaincode("listRemoveListUploadHistory", [startTimestamp, endTimestamp]);
    }

    result = JSON.parse(result.toString());

    let typedResult = [];
    //筛选指定的类型
    if (result) {
        result.forEach(function (row) {
            if (row.type == type) {
                typedResult.push(row);
            }
        })
    }

    // 获取页面数据
    let pageResult = [];
    typedResult.forEach(function (row, id) {
        if (id >= startOffset && id <= endOffset) {
            pageResult.push(row);
        }
    })

    res.json({
        success: true,
        message: "获取成功",
        total: typedResult.length,
        data: pageResult,
    })
}




