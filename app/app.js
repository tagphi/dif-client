var appConfig = require('../config').site

var express = require('express')

var commonFilters = require('./filters/common-filters')
var exceptionFilter = require('./filters/exception-filter')
var tokenManager = require('./interceptors/token-manager')

var blacklistController = require('./controllers/blacklist/index')

let logger = require('./utils/logger-utils').logger()

let chaincodeCron = require('./cron/chaincode-cron')
let mergeCron = require('./cron/merge-cron')
// 上传文件表单的处理
var multer = require('multer')

var app
var router = require('./router')

;(function () {
  // 捕获全局的未捕获的异常
  process.on('uncaughtException', function (err) {
    logger.error(err)
  })

  // 捕获全局的未捕获的异步异常
  process.on('unhandledRejection', function (err) {
    logger.error(err)
  })

  app = express()

  commonFilters.configPreFilters(app)

  tokenManager.checkSession(app)

  // 映射路由
  router.mapRoutes(app)

  // 上传
  let maxFileSize = appConfig.upload.maxFileSize * 1024 * 1024

  let uploadHelper = multer({
    limits: {fileSize: maxFileSize}
  })

  app.post(blacklistController.url + '/upload',
    uploadHelper.single('file'),
    router.asyncWrapper(blacklistController.upload))

  // 全局异常处理
  app.use(exceptionFilter)

  let port = appConfig.port
  app.listen(port, () => logger.info('listen ' + port + ' , server started!'))

  if (appConfig.cron.enabled) {
    _startCrons()
  }
})()

function _startCrons () {
  // 背书节点，启动链码同步定时器
  chaincodeCron.startCron()

  setTimeout(function () {
    mergeCron.startCron()
  }, 120 * 1000)
}
