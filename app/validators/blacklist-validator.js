/**
 * 黑名单模块的验证器
 **/

var checkDataFormat = function (list, type) {
    let lines = list.split("\n");

    let err = undefined;
    lines.forEach((row) => {
        if (!row) {
            return; // 接受空行作为文件结尾
        }

        // let cols = row.split("\t");
        let cols = row.split("\t");

        if ("device" === type && cols.length !== 4
            || "ip" === type && cols.length !== 2
            || "default" === type && cols.length !== 3) {
            err = "invalid format " + row;
            return;
        }

        let flagPos = row.lastIndexOf("\t");
        flagPos++;
        let flag = row.substring(flagPos);

        if (flag !== "1" && flag !== "0") {
            err = "unknown flag " + row;
            return;
        }

        let validDeviceTypes = ["IMEI", "IDFA", "MAC", "ANDROIDID"];
        let validEncryptTypes = ["MD5", "RAW"];

        if ("device" === type) {
            let deviceType = cols[1];
            let encryptType = cols[2];

            if (validEncryptTypes.indexOf(encryptType) === -1) {
                err = "unknown device type " + row;
                return;
            }

            if (validDeviceTypes.indexOf(deviceType) === -1) {
                err = "unknown device type " + row;
                return;
            }
        }

        if ("default" === type) {
            let deviceType = cols[1];

            if (validDeviceTypes.indexOf(deviceType) === -1) {
                err = "unknown device type " + row;
                return;
            }
        }
    });

    return err;
}


exports.checkDataFormat = checkDataFormat;