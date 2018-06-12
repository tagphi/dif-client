'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('chaincode-service');

var CONFIG = require('../../config.json');
var invoke = require('../cc/invoke');
var query = require('../cc/query');

var responseUtils = require('./response-utils.js');

var __validateFormat = function(list, type) {
    let lines = list.split("\n");

    lines.forEach((row) => {
        if (!row) {
            return; // 接受空行作为文件结尾
        }

        let cols = row.split("\t");

        if ("device" === type && cols.length !== 4 || "ip" === type && cols.length !== 2
            || "default" === type && cols.length !== 3) {
            throw new Error("invalid format " + row);
        }

        let flagPos = row.lastIndexOf("\t");
        flagPos++;
        let flag = row.substring(flagPos);

        if (flag !== "1" && flag !== "0") {
            throw new Error("unknown flag " + row);
        }

        let validDeviceTypes = ["IMEI", "IDFA", "MAC", "ANDROIDID"];
        let validEncryptTypes = ["MD5", "RAW"];

        if ("device" === type) {
            let deviceType = cols[1];
            let encryptType = cols[2];

            if(validEncryptTypes.indexOf(encryptType) === -1) {
                throw new Error("unknown device type " + row);
            }

            if(validDeviceTypes.indexOf(deviceType) === -1) {
                throw new Error("unknown device type " + row);
            }
        }

        if ("default" === type) {
            let deviceType = cols[1];

            if(validDeviceTypes.indexOf(deviceType) === -1) {
                throw new Error("unknown device type " + row);
            }
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

var listDeltaUploadHistory = async function(req, res) {
    let date = new Date();

    date.setDate(date.getDate() - 1)
    let startTimestamp = date.getTime().toString()

    date.setDate(date.getDate() + 2)
    let endTimestamp = date.getTime().toString()

    let data = await query("listDeltaUploadHistory", [startTimestamp, endTimestamp])

    console.log(data)

    res.end()
}

exports.deltaUpload = deltaUpload
exports.listDeltaUploadHistory = listDeltaUploadHistory