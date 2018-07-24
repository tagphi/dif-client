/* eslint-disable no-trailing-spaces */
'use strict'
var helper = require('./common/helper')

let util = require('util')

var log4js = require('log4js')
var logger = log4js.getLogger('install-chaincode')
let path = require('path')

var installChaincode = async function (ccName, ccVersion) {
  let client = await helper.getClient(true)
  let peers = await helper.getOwnPeers(client)

  let ccPath = path.join(__dirname, './chaincode/build')

  var request = {
    targets: peers,
    chaincodePath: ccPath,
    chaincodeId: ccName,
    chaincodeType: 'node',
    chaincodeVersion: ccVersion // TODO: 这些信息应该都要从服务器取得
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
    return {success: true, message: '安装成功'}
  } else {
    logger.error(
      'Failed to send install Proposal or receive valid response. Response null or status is not 200. exiting...'
    )
    return {success: false, message: '安装失败'}
  }
}

installChaincode('dif', 'v7')
