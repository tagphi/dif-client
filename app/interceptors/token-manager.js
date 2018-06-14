var bearerToken = require('express-bearer-token')
var jwt = require('jsonwebtoken')

var jwtConfig = require('../../config.json').site
var secretOrPrivateKey = jwtConfig.jwt_secret

var globalTokens = {}

// 这些url不需要登录即可访问
const bypassList = ['/auth/login', '/static']

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

var checkToken = function (app) {
  app.use(bearerToken())

  // 验证指定用户的token
  app.use(function (req, res, next) {
    // 判断是否属于白名单
    if (__shouldBypass(req.originalUrl)) return next()

    var token = req.token || req.body.token || req.query.token

    jwt.verify(token, secretOrPrivateKey, function (err, decoded) {
      if (err || globalTokens[decoded.username] == null) {
        res.send({
          success: false,
          message: 'Failed to authenticate token. '
        })
      } else {
        if (globalTokens[decoded.username] != null && globalTokens[decoded.username] !== token) {
          res.send({
            success: false,
            message: 'token has expired'
          })
          return
        }

        req.username = decoded.username
        return next()
      }
    })
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
 * 更新或设置指定用户的token
 */
function updateToken (username, password) {
  var token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + parseInt(jwtConfig.jwt_expiretime),
    username: username,
    password: password
  }, jwtConfig.jwt_secret)

  try {
    globalTokens[username] = token
    return token
  } catch (err) {
    return null
  }
}

/**
 * 删除用户的登录token
 */
function deleteToken (username) {
  delete globalTokens[username]
}

exports.checkToken = checkToken
exports.updateToken = updateToken
exports.deleteToken = deleteToken
