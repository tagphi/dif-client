'use strict'

var utils = require('fabric-client/lib/utils.js')
var logger = utils.getLogger('cc/query')

var helper = require('../../common/helper.js')
var CONFIG = require('../../config')
let ccUtil = require('./cc-utils')

var query = async function (fcn, args) {
  try {
    let client = await helper.getClient(CONFIG.msp.id, true)
    client.setConfigSetting('discovery-protocol', 'grpc')
    let channel = await helper.getChannel(client)

    var request = {
      chaincodeId: 'dif', // TODO: 配置中读取
      fcn: fcn,
      args: args,
      chainId: CONFIG.channel_name
    }

    let discoverPeers = await helper.getOwnPeers(client)

    channel.addPeer(discoverPeers[0])

    await channel.initialize({discover: true, target: discoverPeers[0]})

    request.targets = ccUtil.extractTargetsFromDiscover(client, channel._discovery_results, CONFIG)

    let responsePayloads = await channel.queryByChaincode(request)
    if (responsePayloads) {
      return responsePayloads[0].toString()
    } else {
      logger.error('responsePayloads is null')
      return 'responsePayloads is null'
    }
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error)
    return error.toString()
  }
}

module.exports = query
