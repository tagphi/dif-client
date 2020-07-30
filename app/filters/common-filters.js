/**
 *  【通用过滤器设置】
 **/
let express = require('express')
let path = require('path')

let bodyParser = require('body-parser')
let bearerToken = require('express-bearer-token')
let CONFIG_SITE = require('../../config').site

/**
 *  配置前置过滤器
 *
 *  @param app {Express} express应用实例
 **/
function configPreFilters (app) {
  app.use((req, res, next) => {
    req.setTimeout(CONFIG_SITE.req_timeout)
    res.setTimeout(CONFIG_SITE.res_timeout)
    next()
  })

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: false}))

  app.use(bearerToken())

  // 配置静态文件
  app.use(express.static(path.join(__dirname, '../../public')))
}

exports.configPreFilters = configPreFilters
