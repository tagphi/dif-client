const util = require('util');
const crypto = require('crypto');
const shim = require('fabric-shim');

const ORG_IDX_NAME = "ORG";
const ORG_DELTA_IDX_NAME = "ORGDELTA";
const MERGED_IDX_NAME = "MERGED";

var Chaincode = class {

    // 初始化链码
    async Init(stub) {
        console.info('========= DIF Init =========');

        let ret = stub.getFunctionAndParameters();

        return shim.success();
    }

    async Invoke(stub) {
        let ret = stub.getFunctionAndParameters();

        let method = this[ret.fcn];

        if (!method) {
            console.log('no method of name:' + ret.fcn + ' found');
            return shim.error('no method of name:' + ret.fcn + ' found');
        }

        try {
            let payload = await method(stub, ret.params);
            return shim.success(payload);
        } catch (err) {
            return shim.error(err.message);
        }
    }

    static __validateFormat(row, type) {
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

            if (validEncryptTypes.indexOf(encryptType) === -1) {
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
    }

    async deltaUpload(stub, args) {
        if (!args || args.length != 2) {
            throw new Error("2 arguments are expected");
        }

        let creator = stub.getCreator();
        let mspid = creator.mspid;
        let deltaList = args[0];
        let type = args[1];

        let orgIdxKey = stub.createCompositeKey(ORG_IDX_NAME, [type, mspid]);
        let oldListStrBuff = await stub.getState(orgIdxKey);
        let oldListStr = "";

        if (oldListStrBuff) {
            oldListStr = oldListStrBuff.toString()
        }

        let orgSet = new Set();

        if (oldListStr) {
            let oldList = JSON.parse(oldListStr);

            oldList.forEach((item) => {
                orgSet.add(item);
            });
        }

        let lines = deltaList.split("\n");

        // 合并到公司设备黑名单列表
        lines.forEach((row) => {
            if (!row) { // 空行表示到了文件结尾
                return;
            }

            Chaincode.__validateFormat(row, type);

            let cols = row.split("\t");

            let flagPos = row.lastIndexOf("\t");

            let record = row.substring(0, flagPos);
            flagPos++;
            let flag = row.substring(flagPos);

            if (flag === "1") { // 增加
                orgSet.add(record);
            } else if (flag === "0") { // 删除
                orgSet.delete(record);
            }
        });

        await stub.putState(orgIdxKey, Buffer.from(JSON.stringify(Array.from(orgSet))));

        // 保存此次更新的文件
        let timestamp = new Date().getTime().toString();
        let deltaRecordsKey = stub.createCompositeKey(ORG_DELTA_IDX_NAME, [timestamp, mspid, type]);

        await stub.putState(deltaRecordsKey, Buffer.from(deltaList));
    }

    async getOrgList(stub, args) {
        let creator = stub.getCreator();
        let mspid = creator.mspid;

        let type = args[0];

        let orgIdxKey = stub.createCompositeKey(ORG_IDX_NAME, [type, mspid]);

        let result = await stub.getState(orgIdxKey);

        return result;
    }

    async listDeltaUploadHistory(stub, args) {
        if (!args || args.length != 2) {
            throw new Error("should provide 2 timestamp as args");
        }

        let startTs = args[0];
        let endTs = args[1];

        let startKey = stub.createCompositeKey(ORG_DELTA_IDX_NAME, [startTs]);
        let endKey = stub.createCompositeKey(ORG_DELTA_IDX_NAME, [endTs]);

        let ite = await stub.getStateByRange(startKey, endKey);

        let results = [];

        while (true) {
            let history = await ite.next();

            if (!history) {
              return Buffer.from(JSON.stringify(results));
            }

            let objectType;
            let attributes;

            ({
              objectType,
              attributes
            } = stub.splitCompositeKey(history.value.key));

            results.push({timestamp: attributes[0],
              mspid: attributes[1],
              type: attributes[2],
              key: history.value.key
            });
        }

        return Buffer.from(JSON.stringify(results));
    }

    async merge(stub, args) {
        let type = args[0];

        let orgs = await stub.getStateByPartialCompositeKey(ORG_IDX_NAME, [type]);

        let mergedList = {};

        while (true) {
            let oneOrg = await orgs.next();

            if (!oneOrg || !oneOrg.value || !oneOrg.value.key) {
                break;
            }

            let objectType;
            let attributes;

            ({
                objectType,
                attributes
            } = stub.splitCompositeKey(oneOrg.value.key));

            let mspid = attributes[1];

            var items = JSON.parse(oneOrg.value.value.toString('utf8'));

            items.forEach((item) => {
                if (item in mergedList) {
                    mergedList[item].add(mspid);
                } else {
                    mergedList[item] = new Set([mspid]);
                }
            });
        };

        let key;
        let finnalList = {};

        if ("device" === type) {
            for (key in mergedList) {
                finnalList[key] = Array.from(mergedList[key]);
            }
        } else {
            for (key in mergedList) {
                let concurredOrg = Array.from(mergedList[key]);

                if (concurredOrg.length >= 2) {
                    finnalList[key] = concurredOrg;
                }
            }
        }

        let mergedListKey = stub.createCompositeKey(MERGED_IDX_NAME, [type]);

        await stub.putState(mergedListKey, 
            Buffer.from(JSON.stringify(finnalList)));
    }

    async getMergedList(stub, args) {
        let type = args[0];

        let mergedListKey = stub.createCompositeKey(MERGED_IDX_NAME, [type]);

        let result = await stub.getState(mergedListKey);

        return result;
    }
};

module.exports = Chaincode;