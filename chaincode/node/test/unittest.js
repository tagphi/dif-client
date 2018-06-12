var assert = require('assert');
var sinon = require('sinon');

var Chaincode = require('../chaincode');
var MockStub = require('./mockstub');

var idArray2String = function(idArray, flag) {
    let str = "";

    idArray.forEach((id) =>  {
        str += id + "\t" + flag + "\n";
    });

    return str;
}

var listEquals = function(a, b) {
    let equals = true;

    a.forEach((i) => {
        if (b.indexOf(i) == -1) {
            equals = false;
            return;
        }
    });

    b.forEach((i) => {
        if (a.indexOf(i) == -1) {
            equals = false;
            return;
        }
    });

    return equals;
}

describe('Chaincode', function() {
    var chaincode = new Chaincode();
    var mockStub;
    var getFunctionAndParameters;
    var getCreator;

    beforeEach(function() {
        mockStub = new MockStub(); // 清除数据
        getCreator = sinon.stub(mockStub, 'getCreator');

        getCreator.returns({mspid: "RTBAsia"}); // 默认组织

        getFunctionAndParameters = sinon.stub(mockStub, 'getFunctionAndParameters');
    });

    var setOrg = function(org) {
        getCreator.returns({mspid: org});
    }

    var makeCall = function(fcn, args) {
        getFunctionAndParameters.returns({fcn: fcn, params: args});
    }

    describe('#Init()', function() {
        it('we do nothing in init function', async function() {
            let chaincode = new Chaincode();
            let mockStub = new MockStub();

            let rt = await chaincode.Init(mockStub);

            assert.equal(rt.status, 200);
        });
    });

    describe('#deltaUpload()', function() {
        it('should returns error if format is invalid', async function() {
            makeCall("deltaUpload", ["invalidlist", "device"]);

            let rt = await chaincode.Invoke(mockStub);

            assert.ok(rt.status == 500 && (rt.message.toString().indexOf("invalid format") > -1));
        });

        it('should merge new devicies to this org empty list', async function() {
            let ids2Add = ["device1\tIMEI\tMD5", "device2\tIMEI\tMD5"];
            let deltaList = idArray2String(ids2Add, "1");

            makeCall("deltaUpload", [deltaList, "device"]);

            let rt = await chaincode.Invoke(mockStub);

            assert.equal(rt.status, 200);

            let idxKey = mockStub.createCompositeKey("ORG", ["device", "RTBAsia"]);

            let orgDeviceListBuffer = await mockStub.getState(idxKey);
            let orgDeviceList = JSON.parse(orgDeviceListBuffer.toString());

            console.log(orgDeviceList);

            assert.ok(listEquals(orgDeviceList, ids2Add));
        });

        it('should merge new devicies to an existed list', async function() {
            // 先存入两个设备号作为组织的已有设备黑名单列表
            let ids2Add1 = ["device1\tIMEI\tMD5", "device2\tIMEI\tMD5"];
            let deltaList = idArray2String(ids2Add1, "1");

            makeCall("deltaUpload", [deltaList, "device"]);

            let rt = await chaincode.Invoke(mockStub);

            // 添加两个新id
            let ids2Add2 = ["device3\tIMEI\tMD5", "device4\tIMEI\tMD5"];
            deltaList = idArray2String(ids2Add2, "1");

            makeCall("deltaUpload", [deltaList, "device"]);

            rt = await chaincode.Invoke(mockStub);

            let expectedMergedList = ids2Add1.concat(ids2Add2);

            let idxKey = mockStub.createCompositeKey("ORG", ["device", "RTBAsia"]);
            let orgDeviceListBuffer = await mockStub.getState(idxKey);
            let orgDeviceList = JSON.parse(orgDeviceListBuffer.toString());

            assert.ok(listEquals(expectedMergedList, orgDeviceList));
        });

        it('should remove device from existed list', async function() {
            // 先存入两个设备号作为组织的已有设备黑名单列表
            let ids2Add1 = ["device1\tIMEI\tMD5", "device2\tIMEI\tMD5"];
            let deltaList = idArray2String(ids2Add1, "1");

            makeCall("deltaUpload", [deltaList, "device"]);

            let rt = await chaincode.Invoke(mockStub);

            // 删除一个设备号
            let ids2Add2 = ["device1\tIMEI\tMD5"];
            deltaList = idArray2String(ids2Add2, "0");

            makeCall("deltaUpload", [deltaList, "device"]);

            rt = await chaincode.Invoke(mockStub);

            let expectedMergedList = ["device2\tIMEI\tMD5"];

            let idxKey = mockStub.createCompositeKey("ORG", ["device", "RTBAsia"]);

            let orgDeviceListBuffer = await mockStub.getState(idxKey);
            let orgDeviceList = JSON.parse(orgDeviceListBuffer.toString());

            assert.ok(listEquals(expectedMergedList, orgDeviceList));
        });    

        it('should save delta list', async function() {
            let ids2Add = ["device1\tIMEI\tMD5", "device2\tIMEI\tMD5"];
            let deltaList = idArray2String(ids2Add, "1");
            
            makeCall("deltaUpload", [deltaList, "device"]);

            let rt = await chaincode.Invoke(mockStub);

            let partialKey = mockStub.createCompositeKey("ORGDELTA", []);
            let deltaListsIterator = await mockStub.getStateByPartialCompositeKey(partialKey);

            let savedDelta = null;

            while (true) {
                let deltaListRecored = await deltaListsIterator.next();

                if (!deltaListRecored || !deltaListRecored.value || !deltaListRecored.value.key) {
                    break;
                }

                savedDelta = deltaListRecored.value.value.toString();
            }

            assert.equal(savedDelta, deltaList);
        });

        describe('#getOrgList()', function() {
            it('should get whatever we saved', async function() {
                let ids2Add = ["device1\tIMEI\tMD5", "device2\tIMEI\tMD5"];
                let deltaList = idArray2String(ids2Add, "1");
                
                makeCall("deltaUpload", [deltaList, "device"]);

                let rt = await chaincode.Invoke(mockStub);

                makeCall("getOrgList", ["device"]);
                rt = await chaincode.Invoke(mockStub);

                assert.ok(listEquals(JSON.parse(rt.payload.toString()), ids2Add));
            });
        });

        describe('#listDeltaUploadHistory()', function() {
            it('should list all history uploads', async function() {
                let ids2Add = ["device1\tIMEI\tMD5", "device2\tIMEI\tMD5"];
                let deltaList = idArray2String(ids2Add, "1");

                makeCall("deltaUpload", [deltaList, "device"]);

                let rt = await chaincode.Invoke(mockStub);

                let date = new Date();

                date.setDate(date.getDate() - 1);
                let startTimestamp = date.getTime().toString();

                date.setDate(date.getDate() + 2);
                let endTimestamp = date.getTime().toString();

                makeCall("listDeltaUploadHistory", [startTimestamp, endTimestamp]);

                rt = await chaincode.Invoke(mockStub);

                let results = JSON.parse(rt.payload.toString());

                assert.equal(results.length, 1);

                let row = results[0];
                assert.equal(row.mspid, "RTBAsia");
                assert.ok(row.key);
            });
        });

        describe('#merge()', function() {
            it('should merge device list committed by two orgs', async function() {
                let ids2Add1 = ["device1\tIMEI\tMD5", "device2\tIMEI\tMD5"];
                let deltaList = idArray2String(ids2Add1, "1");

                makeCall("deltaUpload", [deltaList, "device"]);
                let rt = await chaincode.Invoke(mockStub);

                setOrg("HTT"); // 切换到另一个组织上传

                let ids2Add2 = ["device2\tIMEI\tMD5", "device3\tIMEI\tMD5"];
                deltaList = idArray2String(ids2Add2, "1");

                makeCall("deltaUpload", [deltaList, "device"]);
                
                rt = await chaincode.Invoke(mockStub);

                makeCall("merge", ["device"]); //合并device id
                rt = await chaincode.Invoke(mockStub);

                let mergedListKey = mockStub.createCompositeKey("MERGED", ["device"]);
                let mergedListKeyBuffer = await mockStub.getState(mergedListKey);
                let mergedList = JSON.parse(mergedListKeyBuffer.toString());

                assert.ok("device1\tIMEI\tMD5" in mergedList);
                let device1Orgs = mergedList["device1\tIMEI\tMD5"];
                assert.ok(device1Orgs.length == 1);
                assert.ok(device1Orgs.indexOf("RTBAsia") != -1);

                assert.ok("device3\tIMEI\tMD5" in mergedList);
                let device3Orgs = mergedList["device3\tIMEI\tMD5"];
                assert.ok(device3Orgs.length == 1);
                assert.ok(device3Orgs.indexOf("HTT") != -1);

                assert.ok("device2\tIMEI\tMD5" in mergedList);
                let device2Orgs = mergedList["device2\tIMEI\tMD5"];
                assert.ok(device2Orgs.length == 2);
                assert.ok(device2Orgs.indexOf("RTBAsia") != -1 && device2Orgs.indexOf("HTT") != -1);
            });
        });

        describe('#merge()', function() {
            it('should merge ip list committed by two orgs', async function() {
                let ip2Add1 = ["192.168.0.1", "192.168.0.2"];
                let deltaList = idArray2String(ip2Add1, "1");

                makeCall("deltaUpload", [deltaList, "ip"]);
                let rt = await chaincode.Invoke(mockStub);

                setOrg("HTT"); // 切换到另一个组织上传

                let ip2Add2 = ["192.168.0.2", "192.168.0.3"];
                deltaList = idArray2String(ip2Add2, "1");

                makeCall("deltaUpload", [deltaList, "ip"]);
                
                rt = await chaincode.Invoke(mockStub);

                makeCall("merge", ["ip"]); //合并device id
                rt = await chaincode.Invoke(mockStub);

                let mergedListKey = mockStub.createCompositeKey("MERGED", ["ip"]);
                let mergedListKeyBuffer = await mockStub.getState(mergedListKey);
                let mergedList = JSON.parse(mergedListKeyBuffer.toString());

                let keys = Object.keys(mergedList);
                assert.equal(keys.length, 1); // 应该只有一条结果

                assert.ok("192.168.0.2" in mergedList);

                let ip2Orgs = mergedList["192.168.0.2"];
                assert.ok(ip2Orgs.indexOf("RTBAsia") != -1 && ip2Orgs.indexOf("HTT") != -1);
            });
        });
  });
});