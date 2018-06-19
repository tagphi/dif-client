var appConfig = require('../config').site

var express = require('express')

var commonFilters = require('./filters/common-filters')
var exceptionFilter = require('./filters/exception-filter')
var tokenManager = require('./interceptors/token-manager')

var blacklistController = require('./controllers/blacklist/index')

// 上传文件表单的处理
var multer = require('multer')

var app
var router = require('./router');

(function init () {
  app = express()

  commonFilters.configPreFilters(app)

  tokenManager.checkToken(app)

  // 映射路由
  router.mapRoutes(app)

  // 上传
  let uploadHelper = multer({
    limits: {fileSize: 1 * 1024}
  })
  app.post(blacklistController.url + '/upload',
    uploadHelper.single('file'),
    router.asyncWrapper(blacklistController.upload))

  app.get(blacklistController.url + '/download', router.asyncWrapper(blacklistController.download))

  // 全局异常处理
  app.use(exceptionFilter)

  let port = appConfig.port
  app.listen(port, () => console.log('listen ' + port + ' , server started!'))
})()
