/**
 * 全局的异常处理
 **/
var logger = require('../utils/logger-utils').logger()
var respUtils = require('../utils/resp-utils')
var appConfig = require('../../config').site

function exceptionFilter (err, req, res, next) {
  logger.error(err)

  if (err.code === 'LIMIT_FILE_SIZE') {
    respUtils.errResonse(res, '文件大小不能超过' + appConfig.upload.maxFileSize + 'M')
    return
  }

  if (err.code === 'ECONNREFUSED') {
    respUtils.errResonse(res, '没有连接到Merge服务')
    return
  }

  if (typeof err === 'string') {
    return respUtils.errResonse(res, err)
  }

  if (typeof err === 'object') {
    let errMsg = err.message || err.errmsg || err.error
    if (errMsg) {
      return respUtils.errResonse(res, errMsg)
    }
    return respUtils.errResonse(res, '服务器错误')
  }
}

module.exports = exceptionFilter
