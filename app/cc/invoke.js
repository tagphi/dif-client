'use strict'

var helper = require('../../common/helper.js')
var CONFIG = require('../../config')
var chaincodeUtil = require('../../common/chaincode-util')
let ccUtil = require('./cc-utils')

var invoke = async function (fcn, args) {
  let client = await helper.getClient(CONFIG.msp.id, true)
  client.setConfigSetting('discovery-protocol', 'grpc')
  let channel = await helper.getChannel(client)
  let txId = client.newTransactionID(true)

  let request = {
    chaincodeId: 'dif', // TODO: 配置中读取
    fcn: fcn,
    args: args,
    txId: txId,
    chainId: CONFIG.channel_name
  }

  let discoverPeers = await helper.getOwnPeers(client)

  channel.addPeer(discoverPeers[0])
  await channel.initialize({discover: true, target: discoverPeers[0]})

  request.targets = ccUtil.extractTargetsFromDiscover(client, channel._discovery_results, CONFIG)

  await chaincodeUtil.sendNConfirm(txId, channel,
    async function () {
      return channel.sendTransactionProposal(request, CONFIG.peer.proposal_timeout)
    },
    function (proposalResp) { // TODO: 可能不需要所有背书节点的成功背书，背书策略应该更宽松一点
      return (proposalResp.bad === 0)
    }
  )
}

module.exports = invoke
