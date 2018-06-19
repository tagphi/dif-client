'use strict'
var helper = require('./common/helper')

var fs = require('fs-extra')
let util = require('util')

var log4js = require('log4js')
var logger = log4js.getLogger('install-chaincode')

var installChaincode = async function () {
  // 准备安装的链码
  fs.removeSync('./chaincode/build')
  fs.ensureDirSync('./chaincode/build')
  fs.copySync('./chaincode/node/.npmrc', './chaincode/build/.npmrc')
  fs.copySync('./chaincode/node/chaincode.js', './chaincode/build/chaincode.js')
  fs.copySync('./chaincode/node/dif.js', './chaincode/build/dif.js')
  fs.copySync('./chaincode/node/package.json', './chaincode/build/package.json')

  let client = await helper.getClient(true)
  let peers = helper.getOwnPeers(client)

  var request = {
    targets: peers,
    chaincodePath: './chaincode/build',
    chaincodeId: 'dif',
    chaincodeType: 'node',
    chaincodeVersion: 'v7' // TODO: 这些信息应该都要从服务器取得
  }

  let results = await client.installChaincode(request, 180000)

  let proposalResponses = results[0]

  var allGood = true

  for (var i in proposalResponses) {
    let oneGood = false

    if (proposalResponses && proposalResponses[i].response &&
            proposalResponses[i].response.status === 200) {
      oneGood = true
      logger.info('install proposal was good')
    } else {
      logger.error('install proposal was bad')
    }

    allGood = allGood & oneGood
  }

  if (allGood) {
    logger.info(util.format(
      'Successfully sent install Proposal and received ProposalResponse: Status - %s',
      proposalResponses[0].response.status))
  } else {
    logger.error(
      'Failed to send install Proposal or receive valid response. Response null or status is not 200. exiting...'
    )
  }
}

installChaincode()
