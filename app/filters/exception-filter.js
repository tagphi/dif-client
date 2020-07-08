/**
 * 全局的异常处理
 **/
let logger = require('../utils/logger-utils').logger()
let respUtils = require('../utils/resp-utils')
let CONFIG_SITE = require('../../config').site

function exceptionFilter (err, req, res) {
  logger.error(err)

  if (err.code === 'LIMIT_FILE_SIZE') return respUtils.err(res, '文件大小不能超过' + CONFIG_SITE.upload.maxFileSize + 'M')
  if (err.code === 'ECONNREFUSED') return respUtils.err(res, '没有连接到Merge服务')
  if (typeof err === 'string') return respUtils.err(res, err)

  if (typeof err === 'object') {
    let errMsg = err.message || err.errmsg || err.error || '服务器错误'
    return respUtils.err(res, errMsg)
  }
}

module.exports = exceptionFilter
