var respUtils = require('../../utils/resp-utils')

let stringUtils = require('../../utils/string-utils')
let base64 = require('base-64')

var {check} = require('express-validator/check')

var invokeChaincode = require('../../cc/invoke')
var queryChaincode = require('../../cc/query')

exports.url = '/blacklist'
exports.excludeHandlers = ['upload', 'download']

/**
 * 上传黑名单/移除列表
 **/
exports.validateUpload = [
    check('isBlacklist').not().isEmpty().withMessage('isBlacklist不能为空'),
    check('type').not().isEmpty().withMessage('类型type不能为空')
]

exports.upload = async function (req, res, next) {
    let type = req.body.type
    let isBlacklist = req.body.isBlacklist
    // 格式化数据
    let dataStr = req.file.buffer.toString();

    // 调用链码上传名单
    let result
    if (stringUtils.isTrue(isBlacklist)) {
        result = await invokeChaincode('deltaUpload', [dataStr, type])
    } else {
        result = await invokeChaincode('uploadRemoveList', [dataStr, type])
    }
    respUtils.succResponse(res, '上传成功')
}

/**
 * 合并黑名单
 **/
exports.validateMergeBlacklist = [
    check('type').not().isEmpty().withMessage('类型不能为空')
]

exports.mergeBlacklist = async function (req, res, next) {
    let type = req.body.type
    let result = await invokeChaincode('merge', [type])
    respUtils.succResponse(res, '合并成功', result)
}

/**
 * 下载黑名单
 *
 * result 示例
 device1    IMEI    MD5    1
 device2    IMEI    MD5    1
 **/
exports.validateDownload = [
    check('isBlacklist').not().isEmpty().withMessage('isBlacklist不能为空'),
    check('key').not().isEmpty().withMessage('key不能为空')
]

exports.download = async function (req, res, next) {
    let isBlacklist = req.query.isBlacklist
    let key = req.query.key
    key = base64.decode(key)

    let result = []

    if (stringUtils.isTrue(isBlacklist)) { // 黑名单列表
        result = await queryChaincode('getDeltaList', [key])
    } else { // 删除列表
        result = await queryChaincode('getRemoveList', [key])
    }

    let filename = isBlacklist ? 'blacklist' : 'removeList'
    res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename=' + filename + '--' + new Date().getTime() + '.txt'
    })

    res.send(result)
}

/**
 *获取上传/移除历史
 *
 * result 示例
 *      "[{"timestamp":"1528929803302","mspid":"RTBAsia","type":"device","key":"\u0000ORGDELTA\u00001528929803302\u0000RTBAsia\u0000device\u0000"}]"
 **/
exports.validateHistories = [
    check('isBlacklist').not().isEmpty().withMessage('isBlacklist不能为空'),
    check('startDate').not().isEmpty().withMessage('开始日期不能为空'),
    check('endDate').not().isEmpty().withMessage('结束日期不能为空')
]

exports.histories = async function (req, res, next) {
    let isBlacklist = req.body.isBlacklist
    let startTimestamp = Date.parse(req.body.startDate) + ''
    let endTimestamp = Date.parse(req.body.endDate) + ''

    let pageNO = req.body.pageNO || 1
    let pageSize = req.body.pageSize || 10

    // 计算偏移
    let startOffset = (pageNO - 1) * pageSize
    let endOffset = startOffset + pageSize - 1

    let result

    if (stringUtils.isTrue(isBlacklist)) {
        result = await queryChaincode('listDeltaUploadHistory', [startTimestamp, endTimestamp])
    } else {
        result = await queryChaincode('listRemoveListUploadHistory', [startTimestamp, endTimestamp])
    }

    result = JSON.parse(result)
    // 获取页面数据
    let pageResult = []
    result.forEach(function (row, id) {
        if (id >= startOffset && id <= endOffset) {
            row.key = base64.encode(row.key)
            pageResult.push(row)
        }
    })

    res.json({
        success: true,
        message: '获取成功',
        total: result.length,
        data: pageResult
    })
}
