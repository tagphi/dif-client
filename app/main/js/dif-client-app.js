/**
 *  【客户端入口】
 **/
var appConfig=require("../resources/application");

var express = require('express');
var path=require("path");

var commonFilters=require("./filters/common-filters");
var tokenManager=require("./interceptors/token-manager");

//模块控制器
var authController=require("./controllers/auth-controller");
var BlacklistController=require("./controllers/blacklist-controller");

var controllerToRoutes=require("./utils/controller-router-mapper");

// 上传文件表单的处理
var multer = require('multer');

var app;

/**
 *  入口函数
 **/
(function init() {

    app=express();

    //配置通用前置过滤器
    commonFilters.configPreFilters(app);

    //配置token管理器
    // tokenManager.init(app);

    //【配置各控制器】
    controllerToRoutes(app,authController);
    //控制器路由映射
    routesMapper();

    //启动服务器
    let port=appConfig.server.port;
    app.listen(port, () => console.log('listen ' + port + ' , server started!'));
})();

/**
 * 初始化上传助手
 **/
function initUploadHelper() {
    let uploadDir = path.join(__dirname, "../resources/upload");

    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, uploadDir)
        },
        filename: function (req, file, callback) {
            callback(null, file.originalname)
        }
    })

    let uploadHelper = multer({dest: uploadDir, storage: storage});
    return uploadHelper;
}

/**
 * 控制器路由映射
 **/
function routesMapper() {
    // 【黑名单模块】
    let blacklistCtrl=new BlacklistController();
    //初始化上传助手
    let uploadHelper = initUploadHelper();

    app.post(blacklistCtrl.BASE_ROUTE+"/upload",uploadHelper.single("file"),blacklistCtrl.uploadBlacklist);
}

