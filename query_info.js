'use strict'
var helper = require('./common/helper')

var queryInfo = async function() {
  let client = await helper.getClient(true)
  let channel = await helper.getChannel(client)
  let peers = await helper.getOwnPeers(client)

  try {
    let results = await channel.queryInfo(peers[0])
  } catch (err) {
    console.log(err)
  }

  // console.log(results)
}

var main = async function () {
  await queryInfo()
}

main()