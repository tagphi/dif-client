/**
 * 加载所有controller并应用路由
 */
var fs = require('fs')
var path = require('path')
const {validationResult} = require('express-validator/check')

var utils = require('./utils/resp-utils')
let logger = require('./utils/logger-utils').logger()

exports.mapRoutes = function (app) {
  let dir = path.join(__dirname, 'controllers')

  fs.readdirSync(dir).forEach(function (name) {
    let file = path.join(dir, name)
    if (!fs.statSync(file).isDirectory()) return

    let obj = require(file) // controller object
    let excludeHandlers = obj.excludeHandlers // 要排除的处理器名单

    name = obj.name || name

    let url = obj['url']

    for (var key in obj) {
      if (~['url'].indexOf(key)) continue
      if (~['excludeHandlers'].indexOf(key)) continue

      let handler = obj[key]
      let method = key
      let validator

      // 判断是否是要排除的处理器
      if (excludeHandlers && excludeHandlers.indexOf(method) !== -1) continue

      if (!method.startsWith('validate')) {
        let validatorName = 'validate' + method[0].toUpperCase() + method.substring(1)

        if (validatorName in obj) {
          validator = obj[validatorName]
        }

        // 目前所有请求都需要通过post提交
        let subUrl = url + '/' + method

        if (validator) {
          if (method.indexOf('download') !== -1) {
            app.get(subUrl, validator, asyncWrapper(handler))
          } else {
            app.post(subUrl, validator, asyncWrapper(handler))
          }
        } else {
          if (method.indexOf('download') !== -1) {
            app.get(subUrl, asyncWrapper(handler))
          } else {
            app.post(subUrl, asyncWrapper(handler))
          }
        }
      }
    }
  })
}

/**
 * 异步处理器的包装器
 **/
function asyncWrapper (handler) {
  return async function (req, res, next) {
    _accessLog(req)
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
      utils.errResonse(res, errors.array()[0].msg) // 这个地方应该支持字段和多个错误消息
      res.end()
    } else {
      try {
        await handler(req, res, next)
      } catch (e) {
        next(e)
      }
    }
  }
}

function _accessLog (req) {
  let info = {
    method: req.method,
    originalUrl: req.originalUrl,
    name: req.username,
    token: req.body.token,
    query: req.query,
    body: req.body
  }

  logger.info(JSON.stringify(info))
}

exports.asyncWrapper = asyncWrapper
