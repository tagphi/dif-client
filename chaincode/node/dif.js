/**
 * 存储MMA反作弊小组各成员提交的设备黑名单
 */

const shim = require('fabric-shim');
const util = require('util');
const crypto = require('crypto');

const IDX_NAME = "BLACK_LIST";
const IDX_FINAL_NAME = "BLACK_LIST_FINAL";
const COMMIT_HISTORY_IDX_NAME = "COMMIT_HISTORY";
const MERGE_HISTORY_IDX_NAME = "MERGE_HISTORY";

function md5(str) {
  var md5sum = crypto.createHash('md5');
  
  md5sum.update(str);
  str = md5sum.digest('hex');

  return str;
};

var Chaincode = class {

  // 初始化链码
  async Init(stub) {
    console.info('========= blacklist Init =========');

    let ret = stub.getFunctionAndParameters();

    return shim.success();
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();

    let method = this[ret.fcn];

    if (!method) {
      console.log('no method of name:' + ret.fcn + ' found');
      return shim.success();
    }

    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async invoke(stub, args) {
    let creator = stub.getCreator();
    let mspid = creator.mspid;
    let blacklist = args[0];

    let md5Sum = md5(blacklist);

    let lines = blacklist.split("\n");
    let lineCount = lines.length;
    let timestamp = new Date().getTime().toString();

    let idxKey = stub.createCompositeKey(IDX_NAME, [mspid]);
    await stub.putState(idxKey, Buffer.from(blacklist));

    let historyData = {lineCount: lineCount, md5Sum: md5Sum, txId: stub.getTxID(), mspid: mspid};
    await stub.putState(stub.createCompositeKey(COMMIT_HISTORY_IDX_NAME, [timestamp]), Buffer.from(JSON.stringify(historyData)));
  }

  // 查询某个组织提交的黑名单
  async getCommitedList(stub, args) {
    let creator = stub.getCreator();
    let mspid = creator.mspid;

    let jsonResp = {};

    let idxKey = stub.createCompositeKey(IDX_NAME, [mspid]);
    let Avalbytes = await stub.getState(idxKey);

    if (!Avalbytes) {
      jsonResp.error = 'Failed to get commited blacklist for ' + mspid;
      throw new Error(JSON.stringify(jsonResp));
    }

    jsonResp.org = mspid;
    jsonResp.blacklist = Avalbytes.toString();

    return Avalbytes;
  }

  // 查询合并后的黑名单
  async getMergedList(stub, args) {
    let creator = stub.getCreator();
    let mspid = creator.mspid;
    let jsonResp = {};

    let Avalbytes = await stub.getState(IDX_FINAL_NAME);

    if (!Avalbytes) {
      jsonResp.error = 'Failed to get commited blacklist for ' + mspid;
      throw new Error(JSON.stringify(jsonResp));
    }

    return Avalbytes;
  }

  // 合并多个组织提交的黑名单，保留超过1/3成员共有的
  async merge(stub, args) {
    // 取得所有组织目前提交的黑名单
    let allOrgsListIterator = await stub.getStateByPartialCompositeKey(IDX_NAME, []);
    let countMap = {};
    let orgCount = 0;

    while (true) {
      let oneOrgRecord = await allOrgsListIterator.next();

      if (!oneOrgRecord || !oneOrgRecord.value || !oneOrgRecord.value.key) {
        break;
      }

      let oneOrgDevices = oneOrgRecord.value.value.toString('utf8');
      oneOrgDevices = oneOrgDevices.split("\n");

      oneOrgDevices.forEach(function(deviceId, index) {
        if (deviceId in countMap) {
            countMap[deviceId] = countMap[deviceId] + 1;
        } else {
            countMap[deviceId] = 1;
        }
      });

      orgCount++;
    }

    let result = [];
    let minAgreement = 2; // 需要超过2个成员公认

    for (let key in countMap) {
        if (countMap[key] >= minAgreement) {
            result.push(key);
        }
    }

    await stub.putState(IDX_FINAL_NAME, Buffer.from(result.join("\n")));
    
    let timestamp = new Date().getTime().toString();
    let mergeHistoryIdxKey = stub.createCompositeKey(MERGE_HISTORY_IDX_NAME, [timestamp]);

    // log 合并历史
    let historyData = {lineCount: result.length, orgCount: orgCount, txId: stub.getTxID()};

    await stub.putState(mergeHistoryIdxKey, Buffer.from(JSON.stringify(historyData)));
  }

  // 取得提交历史
  async getMergedHistory(stub, args) {
    let results = [];

    let mergedHistoryIterator = await stub.getStateByPartialCompositeKey(MERGE_HISTORY_IDX_NAME, []);

    while (true) {
      let mergedHistory = await mergedHistoryIterator.next();

      console.log(mergedHistory);

      if (!mergedHistory || !mergedHistory.value || !mergedHistory.value.key) {
        return Buffer.from(JSON.stringify(results));
      }

      console.log(mergedHistory.value.key);

      let objectType;
      let attributes;

      ({
        objectType,
        attributes
      } = await stub.splitCompositeKey(mergedHistory.value.key));

      var historyData = JSON.parse(mergedHistory.value.value.toString('utf8'));

      results.push({timestamp: attributes[0],
        lineCount: historyData.lineCount,
        orgCount: historyData.orgCount,
        txId: historyData.txId
      });
    }

    return Buffer.from(JSON.stringify(results));
  }

  // 取得提交历史
  async getCommitedHistory(stub, args) {
    let creator = stub.getCreator();
    let results = [];

    let committedHistoryIterator = await stub.getStateByPartialCompositeKey(COMMIT_HISTORY_IDX_NAME, []);

    while (true) {
      let committedHistory = await committedHistoryIterator.next();

      if (!committedHistory || !committedHistory.value || !committedHistory.value.key) {
        return Buffer.from(JSON.stringify(results));
      }

      let objectType;
      let attributes;

      ({
        objectType,
        attributes
      } = await stub.splitCompositeKey(committedHistory.value.key));

      var historyData = JSON.parse(committedHistory.value.value.toString('utf8'));

      results.push({org: historyData.mspid,
        timestamp: attributes[0],
        lineCount: historyData.lineCount,
        md5Sum: historyData.md5Sum,
        txId: historyData.txId
      });
    }

    return Buffer.from(JSON.stringify(results));
  }
};

shim.start(new Chaincode());