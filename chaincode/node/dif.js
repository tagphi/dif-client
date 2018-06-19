/**
 * 存储MMA反作弊小组各成员提交的设备黑名单
 */
const shim = require('fabric-shim')
const Chaincode = require('./chaincode')

shim.start(new Chaincode())
