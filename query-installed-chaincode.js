'use strict'
var helper = require('./common/helper')

/**
 *  installedCC 示例：
 *  [ { name: 'dif', version: 'v7' },
 { name: 'dif', version: 'v8' } ]
 **/
async function queryInstalledCC () {
  let client = await helper.getClient(true)
  let peers = helper.getOwnPeers(client)

  let response = await client.queryInstalledChaincodes(peers, true)

  let installedCC = []

  if (response.chaincodes != null) {
    response.chaincodes.forEach(ccInfo => {
      installedCC.push({name: ccInfo.name, version: ccInfo.version})
    })
  }
  return installedCC
}

exports.queryInstalledCC = queryInstalledCC
