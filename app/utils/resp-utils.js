'use strict'

let CONFIG_SITE = require('../../config').site
let logger = require('../utils/logger-utils').logger
var errResonse = function (res, msg) {
  var response = {
    success: false,
    message: msg
  }
  logger.info(response)

  res.json(response)
}

var succResponse = function (res, msg, data) {
  var respData = {
    success: true,
    message: msg
  }
  logger.info(respData)

  if (data) {
    respData.data = data
  }

  res.json(respData)
}

function download (res, filename, content) {
  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename=' + filename
  })
  logger.info('downloading file:' + filename)

  res.send(content)
}

function page (res, result, pageNO) {
  pageNO = pageNO || 1
  let pageSize = CONFIG_SITE.pageSize || 10

  // 计算分页的开始结束位置
  let startOffset = (pageNO - 1) * pageSize
  let endOffset = startOffset + pageSize - 1

  let pageResult = _getPageData(result, startOffset, endOffset)

  let ret = {
    success: true,
    message: '查询成功',
    total: result.length,
    pageSize: pageSize
  }
  logger.info(ret)

  ret.data = pageResult
  res.json(ret)
}

function _getPageData (result, startOffset, endOffset) {
  let pageResult = []
  result.forEach(function (row, id) {
    if (id >= startOffset && id <= endOffset) {
      pageResult.push(row)
    }
  })
  return pageResult
}

exports.errResonse = errResonse
exports.succResponse = succResponse
exports.download = download
exports.page = page
