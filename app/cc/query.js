'use strict'

let utils = require('fabric-client/lib/utils.js')
let logger = utils.getLogger('cc/query')

let helper = require('../../common/helper.js')
let CONFIG = require('../../config')
let ccUtil = require('./cc-utils')

let query = async (fcn, args) => {
  try {
    let client = await helper.getClient(CONFIG.msp.id, true)
    client.setConfigSetting('discovery-protocol', 'grpc')
    let channel = await helper.getChannel(client)

    let ccRequest = {
      chaincodeId: 'dif', // TODO: 配置中读取
      fcn: fcn,
      args: args,
      chainId: CONFIG.channel_name
    }

    let discoverPeers = await helper.getOwnPeers(client)

    channel.addPeer(discoverPeers[0])

    await channel.initialize({discover: true, target: discoverPeers[0]})

    ccRequest.targets = ccUtil.extractTargetsFromDiscover(client, channel._discovery_results, CONFIG)

    let responsePayloads = await channel.queryByChaincode(ccRequest)

    if (responsePayloads) {
      let result = responsePayloads[0].toString()
      logger.info(`[query cc] -- fn:${fcn},args:${JSON.stringify(args).substr(0,100)},result:${result.substring(0,100)}`)
      return result
    } else {
      logger.error('responsePayloads is null')
      return 'responsePayloads is null'
    }
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error)

    if (error.message.indexOf('Failed to connect before the deadline') !== -1) throw new Error('无法连接peer')

    throw error
  }
}

module.exports = query
