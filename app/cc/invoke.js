'use strict'

let helper = require('../../common/helper.js')
let CONFIG = require('../../config')
let chaincodeUtil = require('../../common/chaincode-util')
let ccUtil = require('./cc-utils')

let invoke = async function (fcn, args) {
  let client = await helper.getClient(CONFIG.msp.id, true)
  client.setConfigSetting('discovery-protocol', 'grpc')

  let channel = await helper.getChannel(client)
  let txId = client.newTransactionID(true)

  // 追加版本号，用于链码侧兼容
  args.unshift(CONFIG.site.version || '-1')

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
    async () => channel.sendTransactionProposal(request, CONFIG.peer.proposal_timeout),
    proposalResp => (proposalResp.bad === 0)
  )
}

module.exports = invoke
