var bearerToken = require('express-bearer-token')

var globalSession = {}
var logger = require('../utils/logger-utils').logger()

const TIME_UNIT_30_MIN = 1000 * 60 * 30

// 这些url不需要登录即可访问
const bypassList = [
  '/auth/login',
  '/static', '/blacklist/download',
  '/blacklist/downloadMergedlist',
  '/blacklist/downloadRealIPs',
  '/blacklist/downloadPublishIPs',
  '/blacklist/callback',
  '/blacklist/upload']
let whitelist = require('../../config').site.whitelist

var __shouldBypass = function (url) {
  if (!url) return false

  let len = bypassList.length

  for (let i = 0; i < len; i++) {
    if (url.indexOf(bypassList[i]) >= 0) {
      return true
    }
  }

  return false
}

var isInWhiteList = function (req) {
  if (!whitelist || whitelist.length === 0) return false

  let remoteIp = req.ip
  logger.info('remoteIp-->' + remoteIp)

  if (remoteIp.startsWith('::ffff:172.')) {
    return true
  }

  let isWhiteIP = false
  whitelist.forEach(function (whiteIP) {
    if (remoteIp.indexOf(whiteIP) !== -1) {
      isWhiteIP = true
    }
  })

  return isWhiteIP
}

var checkSession = function (app) {
  app.use(bearerToken())

  // 验证指定用户的token
  app.use(function (req, res, next) {
    // 判断是否属于白名单
    if (__shouldBypass(req.originalUrl) || isInWhiteList(req)) return next()

    var sessionId = req.token || req.body.token || req.query.token
    var session = globalSession[sessionId]

    if (!session) {
      res.send({
        success: false,
        message: 'Failed to authenticate token.'
      })
      return
    }

    if (session.expireTime < new Date().getTime()) {
      res.send({
        success: false,
        message: 'token has expired'
      })
      return
    }

    refreshSession(session)

    return next()
  })

  // token失效时候错误处理
  app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      let reqUrl = req.originalUrl

      if (reqUrl === '/' || reqUrl.indexOf('/static') >= 0) { // 静态请求
        res.redirect('/static/#!/')// 重新登录
      } else {
        res.send({
          success: false,
          message: 'token has expired'
        })
      }
    }
  })
}

/**
 * 创建
 **/
function createSession () {
  const sesssionId = Math.random().toString(36).slice(-8).toUpperCase()

  globalSession[sesssionId] = {
    id: sesssionId
  }

  refreshSession(globalSession[sesssionId])

  return sesssionId
}

/**
 * 刷新
 */
function refreshSession (session) {
  if (!session.expireTime) {
    session.expireTime = new Date().getTime()
  }

  session.expireTime = session.expireTime + TIME_UNIT_30_MIN
}

/**
 * 删除用户的登录会话
 */
function deleteSession (sessionId) {
  delete globalSession[sessionId]
}

exports.createSession = createSession
exports.refreshSession = refreshSession

exports.checkSession = checkSession
exports.deleteSession = deleteSession
