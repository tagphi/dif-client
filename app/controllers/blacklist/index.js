/* eslint-disable no-trailing-spaces,node/no-deprecated-api */
var respUtils = require('../../utils/resp-utils')
var {check} = require('express-validator/check')

var invokeChaincode = require('../../cc/invoke')
var queryChaincode = require('../../cc/query')

let ipfsCli = require('../../utils/ipfs-cli')

let blacklistService = require('../../services/blacklist-service')

let blacklistValidator = require('../../validators/blacklist-validator')
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
  check('name').not().isEmpty().withMessage('name不能为空'),
  check('path').not().isEmpty().withMessage('path不能为空')
]

exports.download = async function (req, res, next) {
  let path = req.query.path
  let name = req.query.name
  let result = await ipfsCli.get(path)
  let content = result.content.toString()
  respUtils.download(res, name, content)
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

exports.downloadMergedlist = async function (req, res, next) {
  let type = req.query.type
  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename=' + type + '-' + new Date().getTime() + '.txt'
  })

  let result = await invokeChaincode('merge', [type])

  result = await queryChaincode('getMergedList', [type])
  if (!result || result.indexOf('Err') !== -1) {
    res.send('')
    return
  }

  if (!result || result.indexOf('Err') !== -1) {
    res.send('')
    return
  } else {
    result = JSON.parse(result)
  }

  let resultStr = ''
  for (let prop in result) {
    resultStr += prop + ':'
    let orgs = result[prop].join(',')
    resultStr += orgs + '\n'
  }

  res.send(resultStr)
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
  respUtils.page(res, result, pageNO)
}
