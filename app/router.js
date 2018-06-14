/**
 * 加载所有controller并应用路由
 */
var fs = require('fs')
var path = require('path')
var express = require('express')
const {check, validationResult} = require('express-validator/check')

var asyncWrapper = require("express-async-wrapper");

var utils = require('./utils/resp-utils')

module.exports = function (app) {
    let dir = path.join(__dirname, 'controllers')

    fs.readdirSync(dir).forEach(function (name) {
        let file = path.join(dir, name)
        if (!fs.statSync(file).isDirectory()) return

        let obj = require(file) // controller object
        let excludeHandlers = obj.excludeHandlers; //要排除的处理器名单

        name = obj.name || name

        let url = obj['url']

        for (var key in obj) {
            if (~['url'].indexOf(key)) continue
            if (~['excludeHandlers'].indexOf(key)) continue

            let handler = obj[key]
            let method = key
            let validator

            //判断是否是要排除的处理器
            if (excludeHandlers && excludeHandlers.indexOf(method) != -1) continue;

            if (!method.startsWith('validate')) {
                let validatorName = 'validate' + method[0].toUpperCase() + method.substring(1)

                if (validatorName in obj) {
                    validator = obj[validatorName]
                }

                // 目前所有请求都需要通过post提交
                let subUrl = url + '/' + method

                if (validator) {

                    app.post(subUrl, validator, asyncWrapper(async (req, res, next) => { // 如果有表单验证器的话这里装饰一下，有错误直接返回
                        let errors = validationResult(req)

                        if (!errors.isEmpty()) {
                            utils.errResonse(res, errors.array()[0].msg) // TODO: 这个地方应该支持字段和多个错误消息
                            res.end()
                        } else {
                            handler(req, res, next)
                        }
                    }))
                } else {
                    app.post(subUrl, asyncWrapper(handler))
                }
            }
        }
    })
}
