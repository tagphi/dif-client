'use strict'

var utils = require('fabric-client/lib/utils.js')
var logger = utils.getLogger('cc/query')

var helper = require('../../common/helper.js')
var CONFIG = require('../../config')

var query = async function (fcn, args) {
  try {
    let client = await helper.getClient(CONFIG.msp.id, true)
    let channel = await helper.getChannel(client)

    // send query
    var request = {
      chaincodeId: 'dif', // TODO: 配置中读取
      fcn: fcn,
      args: args,
      chainId: CONFIG.channel_name
    }

    request.targets = await helper.getEndorsers(client)

    let responsePayloads = await channel.queryByChaincode(request)

    if (responsePayloads) {
      // return response_payloads.toString('utf8')
      return responsePayloads.toString()
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
