let bearerToken = require('express-bearer-token')
let respUtils = require('../utils/resp-utils')
let globalSessions = {}

let logger = require('../utils/logger-utils').logger()

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

let __shouldBypass = url => {
  if (!url) return false

  for (let item of bypassList) {
    if (url.indexOf(item) >= 0) return true
  }

  return false
}

/*
* ip白名单
* */
let isInIpWhiteList = req => {
  if (!whitelist || whitelist.length === 0) return false

  let remoteIp = req.ip
  logger.info(`remoteIp-->${remoteIp}`)

  if (remoteIp.startsWith('::ffff:172.')) return true

  for (let whiteIp of whitelist) {
    if (remoteIp.indexOf(whiteIp) !== -1) return true
  }

  return false
}

let checkSession = app => {
  app.use(bearerToken())

  // 验证指定用户的token
  app.use((req, res, next) => {
    // 判断是否属于白名单
    if (__shouldBypass(req.originalUrl) || isInIpWhiteList(req)) return next()

    let sessionId = req.token || req.body.token || req.query.token
    let session = globalSessions[sessionId]

    if (!session) return respUtils.err(res, 'Failed to authenticate token.')

    if (session.expireTime < new Date().getTime()) return respUtils.err(res, 'token has expired')

    refreshSession(session)

    return next()
  })

  // token失效时候错误处理
  app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
      let reqUrl = req.originalUrl

      // 静态请求
      if (reqUrl === '/' || reqUrl.indexOf('/static') >= 0) res.redirect('/static/#!/')
      else respUtils.err(res, 'token has expired')// 重新登录
    }
  })
}

/**
 * 创建
 **/
function createSession () {
  const sesssionId = Math.random().toString(36).slice(-8).toUpperCase()

  globalSessions[sesssionId] = {id: sesssionId}

  refreshSession(globalSessions[sesssionId])

  return sesssionId
}

/**
 * 刷新
 */
function refreshSession (session) {
  if (!session.expireTime) session.expireTime = new Date().getTime()

  session.expireTime = session.expireTime + TIME_UNIT_30_MIN
}

/**
 * 删除用户的登录会话
 */
function deleteSession (sessionId) {
  delete globalSessions[sessionId]
}

exports.createSession = createSession
exports.refreshSession = refreshSession

exports.checkSession = checkSession
exports.deleteSession = deleteSession
