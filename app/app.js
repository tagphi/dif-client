/**
 *  【客户端入口】
 **/
var appConfig = require("../config").site;

var express = require('express');


/**
 * 工具组
 **/
let uploadHelper = require("./utils/upload-helper");
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
var authController = require("./controllers/auth-controller");
var blacklistController = require("./controllers/blacklist-controller");

var controllerToRoutes = require("./utils/controller-router-mapper");

// 上传文件表单的处理
var multer = require('multer');

var app;

/**
 *  入口函数
 **/
(function init() {

    app = express();

    //配置通用前置过滤器
    commonFilters.configPreFilters(app);

    //配置token管理器
    // tokenManager.init(app);

    //【配置各控制器】
    controllerToRoutes(app, authController);
    controllerToRoutes(app, blacklistController, ["uploadBlacklist"]);
    //上传
    app.post(blacklistController.BASE_ROUTE + "/uploadBlacklist",
        uploadHelper.single("file"),
        asyncWrapper(blacklistController.uploadBlacklist));


    //全局异常处理
    app.use(exceptionFilter);

    //启动服务器
    let port = appConfig.port;
    app.listen(port, () => console.log('listen ' + port + ' , server started!'));
})();


