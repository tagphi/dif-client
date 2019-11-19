/**
 *  【认证模块管理器】
 **/
// 管理员
var admin = require('../../../config').site

var respUtils = require('../../utils/resp-utils')

var tokenManager = require('../../interceptors/token-manager')

var {check} = require('express-validator/check')
const CONFIG_SITE = require('../../../config').site

exports.url = '/auth'

exports.validateLogin = [
  check('username').not().isEmpty().withMessage('用户名不能为空'),
  check('password').not().isEmpty().withMessage('密码不能为空')
]

/**
 *  登录接口
 **/
exports.login = async function login (req, res, next) {
  var username = req.body.username
  var password = req.body.password

  if (username === admin.username && password === admin.password) {
    var sessionId = tokenManager.createSession()

    res.status(200).json({
      success: true,
      token: sessionId,
      username: username
    })
  } else {
    respUtils.errResonse(res, '无效的用户名或密码')
  }
}

/**
 *  退出接口
 **/
exports.logout = async function logout (req, res, next) {
  tokenManager.deleteSession(req.body.token)

  res.status(200).json({
    success: true,
    message: '退出成功'
  })
}

/**
 *  是否是观察者
 **/
exports.watcher = async function (req, res) {
  respUtils.succResponse(res, '获取成功', {isWatcher: CONFIG_SITE.watcher})
}
