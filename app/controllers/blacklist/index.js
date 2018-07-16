/* eslint-disable no-trailing-spaces,node/no-deprecated-api */
var respUtils = require('../../utils/resp-utils')
var logger = require('../../utils/logger-utils').logger
const CONFIG__SITE = require('../../../config').site
var {check} = require('express-validator/check')

var queryChaincode = require('../../cc/query')

let ipfsCli = require('../../utils/ipfs-cli')

let blacklistService = require('../../services/blacklist-service')

let blacklistValidator = require('../../validators/blacklist-validator')
let mergeCron = require('../../cron/merge-cron')

exports.url = '/blacklist'
exports.excludeHandlers = ['upload']

/**
 * 上传黑名单/移除列表
 **/
exports.validateUpload = [
  check('dataType').not().isEmpty().withMessage('dataType不能为空'),
  check('type').not().isEmpty().withMessage('类型type不能为空')
]

exports.upload = async function (req, res, next) {
  let type = req.body.type
  let dataType = req.body.dataType
  let dataListStr = req.file.buffer.toString()

  // 校验
  blacklistValidator.validateUpload(dataType, type, dataListStr)
  // 上传
  await blacklistService.upload(dataListStr, type, dataType)

  respUtils.succResponse(res, '上传成功')
}

/**
 * 下载黑名单
 *
 * result 示例
 device1    IMEI    MD5    1
 device2    IMEI    MD5    1
 **/
exports.validateDownload = [
  check('name').not().isEmpty().withMessage('name不能为空'),
  check('path').not().isEmpty().withMessage('path不能为空')
]

exports.download = async function (req, res, next) {
  let path = req.query.path
  let name = req.query.name
  try {
    let result = await ipfsCli.get(path)
    let content = result.content.toString()
    respUtils.download(res, name, content)
  } catch (e) {
    logger.error(e)
    respUtils.download(res, name, '下载出错')
  }
}

/**
 * 下载合并列表
 *
 * result 示例
 {"device1\tIMEI\tMD5":["RTBAsia"],"device2\tIMEI\tMD5":["RTBAsia"]}
 **/
exports.validateDownloadMergedlist = [
  check('type').not().isEmpty().withMessage('type不能为空')
]

/**
 mergedListIpfsInfo 示例
 {
    "version": 2,
    "ipfsInfo": {
        "path": "QmX96yBwjpwjUrdX64oKkNjUSQ4d7YYyayumsT6ZBpoyiw",
        "hash": "QmX96yBwjpwjUrdX64oKkNjUSQ4d7YYyayumsT6ZBpoyiw",
        "size": 1060314,
        "name": "device-merged-1531304509027.txt"
    }
}
 **/
exports.downloadMergedlist = async function (req, res, next) {
  let type = req.query.type
  let filename = type + '-merged-' + new Date().getTime() + '.txt'

  try {
    // 查询最新的合并版本信息
    let mergedListIpfsInfo = await queryChaincode('getMergedList', [type])
    if (!mergedListIpfsInfo) return respUtils.download(res, filename, '暂无数据')

    // 从ipfs上下载
    mergedListIpfsInfo = JSON.parse(mergedListIpfsInfo)
    let downloadedMergedList = await ipfsCli.get(mergedListIpfsInfo.ipfsInfo.path)
    let content = downloadedMergedList.content.toString()

    respUtils.download(res, filename, content)
  } catch (e) {
    logger.error(e)
    respUtils.download(res, filename, '下载合并版本出错')
  }
}

/**
 * 获取上传/移除历史
 *
 result 示例：
 [ { timestamp: '1531269985958',
    mspid: 'RTBAsia',
    type: 'device',
    ipfsInfo:
     { hash: 'hashhash',
       path: 'somewhereinipfs/filename.ext',
       name: 'filename.ext',
       size: 888 } } ]
 **/
exports.validateHistories = [
  check('dataType').not().isEmpty().withMessage('dataType不能为空'),
  check('startDate').not().isEmpty().withMessage('开始日期不能为空'),
  check('endDate').not().isEmpty().withMessage('结束日期不能为空')
]

exports.histories = async function (req, res, next) {
  let dataType = req.body.dataType
  let startTimestamp = Date.parse(req.body.startDate) + ''
  let endTimestamp = Date.parse(req.body.endDate) + ''

  let pageNO = req.body.pageNO || 1

  let result

  if (dataType === 'delta') {
    result = await queryChaincode('listDeltaUploadHistory', [startTimestamp, endTimestamp])
  } else if (dataType === 'remove') {
    result = await queryChaincode('listRemoveListUploadHistory', [startTimestamp, endTimestamp])
  } else {
    throw new Error('未知的数据类型:' + dataType)
  }

  if (result.indexOf('Err') !== -1) return next(result)

  result = JSON.parse(result)
  // 时间逆序
  result.sort(function (item1, item2) {
    return item2.timestamp - item1.timestamp
  })

  respUtils.page(res, result, pageNO)
}

exports.mergeManually = async function (req, res, next) {
  if (CONFIG__SITE.dev) {
    mergeCron.onTick()
  }
}
