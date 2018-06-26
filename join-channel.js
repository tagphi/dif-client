'use strict'
var helper = require('./common/helper')

var CONFIG=require('./config');

var getGenesisBlock = async function (client, channel) {
  let txId = client.newTransactionID()

  let request = {
    txId: txId
  }

  let genesisBlock = await channel.getGenesisBlock(request)

  return genesisBlock
}

var joinPeer = async function () {
  let client = await helper.getClient(true)
  let channel = await helper.getChannel(client)
  let genesisBlock = await getGenesisBlock(client, channel)

  let txId = client.newTransactionID()

  let request = {
    block: genesisBlock,
    txId: txId
  }

  let peers =await helper.getOwnPeers(client)

  if (peers.length === 0) {
    console.log("can't find current org peers, please contact RTBAsia")
  }

  peers.forEach(function (peer) {
    channel.addPeer(peer)
  })

  return channel.joinChannel(request, CONFIG.peer.join_channel_timeout)
}

var main = async function () {
  await joinPeer()
}

main()
