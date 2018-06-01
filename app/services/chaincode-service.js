'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('chaincode-service');

var CONFIG = require('../../config.json');
var invoke = require('../cc/invoke');

var responseUtils = require('./response-utils.js');

// TODO: ip和device格式不同, device还需要提供加密格式和舍
var __validateFormat = function(list, type) {
    let lines = list.split("\n"); // 换行符分割，每行第一列为id第二列为标识符，0表示删除，1表示增加

    lines.forEach((line) => {
        if (!line) {
            return; // 接受空行作为文件结尾
        }

        let cols = line.split("\t");

        if (cols.length != 2) {
            throw new Error("数据格式错误: " + line);
        }

        let flag = cols[1];

        if (["0", "1"].indexOf(flag) == -1) {
            throw new Error("未知的标识列: " + line);
        }
    });
}

/**
 * 将上传的增量黑名单合并到账本
 */
var deltaUpload = async function(req, res) {
    if (!req.file) {
        responseUtils.errResonse(res, "缺少文件");
        return;
    }

    let type = req.body.type;

    let deltaList = req.file.buffer.toString();

    try {
        __validateFormat(deltaList);
    } catch (e) {
        logger.error(e);
        responseUtils.errResonse(res, e.message);
    }

    try {
        let result = await invoke("deltaUpload", [deltaList, type]);

        res.status(200).json({success : true});
    } catch(e) {
        logger.error(e);
        responseUtils.errResonse(res, e.message);
    }

    res.end();
}

exports.deltaUpload = deltaUpload;