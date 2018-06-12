/**
 *  【认证模块管理器】
 **/
//管理员
var admin=require("../../config").site;

var respUtils = require('../utils/resp-utils');
// token管理器
var tokenManager=require("../interceptors/token-manager");


//验证器
var authValidator=require("../validators/auth-validator");

var logger = require('log4js').getLogger("auth-controller");


var authController={
    BASE_ROUTE:"/auth",
    /**
     *  登录接口
     **/
    async login(req,res,next){
        //验证参数
        let err=authValidator.loginValidator(req);
        if (err) {
            logger.error(err);
            return respUtils.errResonse(res,err);
        }

        var username = req.body.username;
        var password = req.body.password;

        if (username === admin.username && password === admin.password) {
            var token = tokenManager.updateToken(username,password);

            res.status(200).json({
                success : true,
                token : token,
                username : username
            });
        } else {
            respUtils.errResonse(res, "无效的用户名或密码");
        }
    },

    /**
     *  退出接口
     **/
    async logout(req,res,next){
        tokenManager.deleteToken(req.username);
        res.status(200).json({
            success:true,
            message:"退出成功",
        });
    }
}


module.exports=authController;