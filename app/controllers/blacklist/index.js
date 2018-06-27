var respUtils = require('../../utils/resp-utils')

let base64 = require('base-64')

var {check} = require('express-validator/check')

var invokeChaincode = require('../../cc/invoke')
var queryChaincode = require('../../cc/query')

let siteConfig = require('../../../config').site

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
  let dataStr = req.file.buffer.toString()

  // 调用链码上传名单
  let result
  if (dataType === 'delta') {
    result = await invokeChaincode('deltaUpload', [dataStr, type])
  } else if (dataType === 'remove') {
    result = await invokeChaincode('uploadRemoveList', [dataStr, type])
  } else {
    throw new Error('未知的数据类型:' + dataType)
  }

  if (result && result.indexOf('Err') !== -1) {
    throw new Error('上传出错')
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
  check('dataType').not().isEmpty().withMessage('dataType不能为空'),
  check('key').not().isEmpty().withMessage('key不能为空')
]

exports.download = async function (req, res, next) {
  let dataType = req.query.dataType
  let key = base64.decode(req.query.key)
  let keyPieces = key.split('\u0000')
  let filename = ''
  for (let i = 1; i <= 4; i++) {
    filename += keyPieces[i] + '-'
  }

  let result = []

  if (dataType === 'delta') {
    result = await queryChaincode('getDeltaList', [key])
  } else if (dataType === 'remove') {
    result = await queryChaincode('getRemoveList', [key])
  } else {
    throw new Error('未知的数据类型:' + dataType)
  }

  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename=' + filename + new Date().getTime() + '.txt'
  })

  res.send(result)
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
 *获取上传/移除历史
 *
 * result 示例
 *      "[{"timestamp":"1528929803302","mspid":"RTBAsia","type":"device","key":"\u0000ORGDELTA\u00001528929803302\u0000RTBAsia\u0000device\u0000"}]"
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
  let pageSize = siteConfig.pageSize || 10

  // 计算分页的开始结束位置
  let startOffset = (pageNO - 1) * pageSize
  let endOffset = startOffset + pageSize - 1

  let result

  if (dataType === 'delta') {
    result = await queryChaincode('listDeltaUploadHistory', [startTimestamp, endTimestamp])
  } else if (dataType === 'remove') {
    result = await queryChaincode('listRemoveListUploadHistory', [startTimestamp, endTimestamp])
  } else {
    throw new Error('未知的数据类型:' + dataType)
  }

  if (result.indexOf('Err') !== -1) {
    next(result)
    return
  } else {
    result = JSON.parse(result)
  }

  // 取得分页范围内的数据
  let pageResult = []

  result.forEach(function (row, id) {
    if (id >= startOffset && id <= endOffset) {
      row.key = base64.encode(row.key)
      pageResult.push(row)
    }
  })

  res.json({
    success: true,
    message: '查询成功',
    total: result.length,
    data: pageResult
  })
}
