/**
 *  【认证管理的验证器】
 **/
var stringUtils=require("../utils/string-utils");

/**
 *  检查 用户名
 **/
function checkUsername(req) {
    let username = req.body.username;
    if (stringUtils.isEmpty(username)) return "username 不能为空";
    if (!stringUtils.isLengthBetween(username, 2, 40)) return "username 长度不符合要求";
}


/**
 *  检查 密码
 **/
function checkPassword(req) {
    let password = req.body.password;
    if (stringUtils.isEmpty(password)) return "password 不能为空";
    if (!stringUtils.isLengthBetween(password, 3, 40)) return "password 长度不符合要求";
}


/**
 *  登录验证器
 **/
function loginValidator(req) {
    //检查 用户名
    let err=checkUsername(req);
    if (err) return err;

    // 检查密码
    err= checkPassword(req);
    if (err) return err;
}


exports.loginValidator=loginValidator;


