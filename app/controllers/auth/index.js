/**
 *  【认证模块管理器】
 **/
let {err, ok} = require('../../utils/resp-utils')
let {check} = require('express-validator/check')
let tokenManager = require('../../interceptors/token-manager')
const CONFIG_SITE = require('../../../config').site

exports.url = '/auth'

exports.validateLogin = [
  check('username').not().isEmpty().withMessage('用户名不能为空'),
  check('password').not().isEmpty().withMessage('密码不能为空')
]

/**
 *  登录接口
 **/
exports.login = async (req, res) => {
  var username = req.body.username
  var password = req.body.password

  if (username === CONFIG_SITE.username && password === CONFIG_SITE.password) {
    res.status(200)
      .json({
        success: true,
        token: tokenManager.createSession(),
        username: username
      })
  } else {
    err(res, '无效的用户名或密码')
  }
}

/**
 *  退出接口
 **/
exports.logout = async (req, res) => {
  tokenManager.deleteSession(req.body.token)
  ok(res, '退出成功')
}

/**
 *  是否是观察者
 **/
exports.watcher = async (req, res) => {
  ok(res, '获取成功', {isWatcher: CONFIG_SITE.watcher})
}
