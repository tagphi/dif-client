'use strict'

let CONFIG_SITE = require('../../config').site
let logger = require('../utils/logger-utils').logger()

let ok = function (res, msg, data) {
  let respData = {
    success: true,
    message: msg
  }
  logger.info(JSON.stringify(respData).substr(0,100))

  if (data) respData.data = data

  res.json(respData)
}

let err = function (res, msg) {
  let response = {
    success: false,
    message: msg
  }
  logger.info(JSON.stringify(response))

  res.json(response)
}

function download (res, filename, content) {
  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename=' + filename
  })
  logger.info('downloading file:' + filename)

  res.send(content)
}

/*
* 分页
* */
function page (res, list, pageNO) {
  pageNO = pageNO || 1
  let pageSize = CONFIG_SITE.pageSize || 10

  // 计算分页的开始结束位置
  let startOffset = (pageNO - 1) * pageSize
  let endOffset = startOffset + pageSize - 1

  let pageData = list.filter((row, id) => id >= startOffset && id <= endOffset)

  let pageResp = {
    success: true,
    message: '查询成功',
    total: list.length,
    pageSize: pageSize
  }

  logger.info(JSON.stringify(pageResp).substr(0,100))

  pageResp.data = pageData
  res.json(pageResp)
}

exports.err = err
exports.ok = ok
exports.download = download
exports.page = page
