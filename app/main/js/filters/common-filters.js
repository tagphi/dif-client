/**
 *  【通用过滤器设置】
 **/
var express = require('express');
var path=require("path");

var bodyParser = require('body-parser');
var bearerToken = require('express-bearer-token');

/**
 *  配置前置过滤器
 *
 *  @param expApp {Express} express应用实例
 **/
function configPreFilters(expApp) {
    // 配置body解析器
    expApp.use(bodyParser.json());
    expApp.use(bodyParser.urlencoded({
        extended: false
    }));

    //解析token
    expApp.use(bearerToken());

    //配置静态文件
    let staticDir=path.join(__dirname, '../../resources/public');
    expApp.use(express.static(staticDir));
}


exports.configPreFilters=configPreFilters;
