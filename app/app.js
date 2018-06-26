var appConfig = require('../config').site

var express = require('express')

var commonFilters = require('./filters/common-filters')
var exceptionFilter = require('./filters/exception-filter')
var tokenManager = require('./interceptors/token-manager')

var blacklistController = require('./controllers/blacklist/index')

let logger = require('./utils/logger-utils').logger

// 上传文件表单的处理
var multer = require('multer')

var app
var router = require('./router')

;(function () {
  // 捕获全局的为捕获的异常
  process.on('uncaughtException', function (err) {
    logger.error(err)
  })

  // 捕获全局的未捕获的异步异常
  process.on('unhandledRejection', function (err) {
    logger.error(err)
  })

  app = express()

  commonFilters.configPreFilters(app)

  tokenManager.checkToken(app)

  // 映射路由
  router.mapRoutes(app)

  // 上传
  let uploadHelper = multer({
    limits: {fileSize: appConfig.upload.maxFilesize}
  })

  app.post(blacklistController.url + '/upload',
    uploadHelper.single('file'),
    router.asyncWrapper(blacklistController.upload))

  // 全局异常处理
  app.use(exceptionFilter)

  let port = appConfig.port
  app.listen(port, () => console.log('listen ' + port + ' , server started!'))
})()
