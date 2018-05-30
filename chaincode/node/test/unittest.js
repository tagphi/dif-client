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
            let chaincode = new Chaincode();
            let mockStub = new MockStub();

            sinon.stub(mockStub, 'getFunctionAndParameters').returns({fcn: "deltaUpload", params: ["invalidlist", "device"]});
            sinon.stub(mockStub, 'getCreator').returns({mspid: "RTBAsia"});

            let rt = await chaincode.Invoke(mockStub);

            assert.ok(rt.status == 500 && (rt.message.toString().indexOf("invalid format") > -1));
        });

        it('should merge new devicies to this org empty list', async function() {
            let chaincode = new Chaincode();
            let mockStub = new MockStub();

            let ids2Add = ["device1", "device2"];
            let deltaList = idArray2String(ids2Add, "1");

            sinon.stub(mockStub, 'getFunctionAndParameters').returns({fcn: "deltaUpload", params: [deltaList, "device"]});
            sinon.stub(mockStub, 'getCreator').returns({mspid: "RTBAsia"});

            let rt = await chaincode.Invoke(mockStub);

            assert.equal(rt.status, 200);

            let idxKey = mockStub.createCompositeKey("ORG", ["device", "RTBAsia"]);

            let orgDeviceListBuffer = await mockStub.getState(idxKey);
            let orgDeviceList = JSON.parse(orgDeviceListBuffer.toString())

            assert.ok(listEquals(orgDeviceList, ids2Add));
        });

        it('should merge new devicies to an existed list', async function() {
            let chaincode = new Chaincode();
            let mockStub = new MockStub();

            // 先存入两个设备号作为组织的已有设备黑名单列表
            let ids2Add1 = ["device1", "device2"];
            let deltaList = idArray2String(ids2Add1, "1");

            let getFunctionAndParameters = sinon.stub(mockStub, 'getFunctionAndParameters');
            getFunctionAndParameters.returns({fcn: "deltaUpload", params: [deltaList, "device"]});

            sinon.stub(mockStub, 'getCreator').returns({mspid: "RTBAsia"});

            let rt = await chaincode.Invoke(mockStub);

            // 添加两个新id
            let ids2Add2 = ["device3", "device4"];
            deltaList = idArray2String(ids2Add2, "1");

            getFunctionAndParameters.returns({fcn: "deltaUpload", params: [deltaList, "device"]});

            rt = await chaincode.Invoke(mockStub);

            let expectedMergedList = ids2Add1.concat(ids2Add2);

            let idxKey = mockStub.createCompositeKey("ORG", ["device", "RTBAsia"]);
            let orgDeviceListBuffer = await mockStub.getState(idxKey);
            let orgDeviceList = JSON.parse(orgDeviceListBuffer.toString())

            assert.ok(listEquals(expectedMergedList, orgDeviceList));
        });

        it('should remove device from existed list', async function() {
            let chaincode = new Chaincode();
            let mockStub = new MockStub();

            // 先存入两个设备号作为组织的已有设备黑名单列表
            let ids2Add1 = ["device1", "device2"];
            let deltaList = idArray2String(ids2Add1, "1");

            let getFunctionAndParameters = sinon.stub(mockStub, 'getFunctionAndParameters');
            getFunctionAndParameters.returns({fcn: "deltaUpload", params: [deltaList, "device"]});

            sinon.stub(mockStub, 'getCreator').returns({mspid: "RTBAsia"});

            let rt = await chaincode.Invoke(mockStub);

            // 删除一个设备号
            let ids2Add2 = ["device1"];
            deltaList = idArray2String(ids2Add2, "0");

            getFunctionAndParameters.returns({fcn: "deltaUpload", params: [deltaList, "device"]});
            rt = await chaincode.Invoke(mockStub);

            let expectedMergedList = ["device2"];

            let idxKey = mockStub.createCompositeKey("ORG", ["device", "RTBAsia"]);

            let orgDeviceListBuffer = await mockStub.getState(idxKey);
            let orgDeviceList = JSON.parse(orgDeviceListBuffer.toString());

            assert.ok(listEquals(expectedMergedList, orgDeviceList));
        });    

        it('should save delta list', async function() {
            let chaincode = new Chaincode();
            let mockStub = new MockStub();

            let ids2Add = ["device1", "device2"];
            let deltaList = idArray2String(ids2Add, "1");

            let getFunctionAndParameters = sinon.stub(mockStub, 'getFunctionAndParameters');
            getFunctionAndParameters.returns({fcn: "deltaUpload", params: [deltaList, "device"]});
            sinon.stub(mockStub, 'getCreator').returns({mspid: "RTBAsia"});
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
                let chaincode = new Chaincode();
                let mockStub = new MockStub();

                let ids2Add = ["device1", "device2"];
                let deltaList = idArray2String(ids2Add, "1");

                let getFunctionAndParameters = sinon.stub(mockStub, 'getFunctionAndParameters');
                getFunctionAndParameters.returns({fcn: "deltaUpload", params: [deltaList, "device"]});
                sinon.stub(mockStub, 'getCreator').returns({mspid: "RTBAsia"});
                let rt = await chaincode.Invoke(mockStub);

                getFunctionAndParameters.returns({fcn: "getOrgList", params: ["device"]});
                rt = await chaincode.Invoke(mockStub);

                assert.ok(listEquals(JSON.parse(rt.payload.toString()), ids2Add));
            });
        });

        describe('#listDeltaUploadHistory()', function() {
            it('should list all history uploads', async function() {
                let chaincode = new Chaincode();
                let mockStub = new MockStub();

                let ids2Add = ["device1", "device2"];
                let deltaList = idArray2String(ids2Add, "1");

                let getFunctionAndParameters = sinon.stub(mockStub, 'getFunctionAndParameters');
                getFunctionAndParameters.returns({fcn: "deltaUpload", params: [deltaList, "device"]});
                sinon.stub(mockStub, 'getCreator').returns({mspid: "RTBAsia"});
                let rt = await chaincode.Invoke(mockStub);

                let date = new Date();

                date.setDate(date.getDate() - 1);
                let startTimestamp = date.getTime().toString();

                date.setDate(date.getDate() + 2);
                let endTimestamp = date.getTime().toString();

                getFunctionAndParameters.returns({fcn: "listDeltaUploadHistory", params: [startTimestamp, endTimestamp]});
                rt = await chaincode.Invoke(mockStub);

                let results = JSON.parse(rt.payload.toString());

                assert.equal(results.length, 1);

                let row = results[0];
                assert.equal(row.mspid, "RTBAsia");
                assert.ok(row.key);
            });
        });
  });
});