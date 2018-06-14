/**
 *  【客户端入口】
 **/
var appConfig = require("../config").site;

var express = require('express');

/**
 * 工具组
 **/
let asyncWrapper = require("express-async-wrapper");

/**
 * 过滤器
 **/
var commonFilters = require("./filters/common-filters");
var exceptionFilter = require("./filters/exception-filter");
var tokenManager = require("./interceptors/token-manager");

/**
 * 模块控制器
 **/
var authController = require("./controllers/auth/index");
var blacklistController = require("./controllers/blacklist/index");

// 上传文件表单的处理
var multer = require('multer');

var app;
var router = require('./router');

/**
 *  入口函数
 **/
(function init() {

    app = express();

    //配置通用前置过滤器
    commonFilters.configPreFilters(app);

    //配置token管理器
    // TODO:
    // tokenManager.checkToken(app);

    //映射路由
    router(app);

    //上传
    let uploadHelper = multer({
        limits: {fileSize: 1 * 1024}
    });

    // 上传黑名单
    app.post(blacklistController.url + "/uploadBlacklist",
        uploadHelper.single("file"),
        asyncWrapper(blacklistController.uploadBlacklist));

    // 下载黑名单
    app.get(blacklistController.url+"/downloadBlacklist",blacklistController.downloadBlacklist);

    //全局异常处理
    app.use(exceptionFilter);

    //启动服务器
    let port = appConfig.port;
    app.listen(port, () => console.log('listen ' + port + ' , server started!'));
})();

