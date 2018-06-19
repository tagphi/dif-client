'use strict'
var helper = require('./common/helper')
var CONFIG = require('./config.json')
var path = require('path')
var fs = require('fs-extra')

var log4js = require('log4js')
var logger = log4js.getLogger('join-channel')

var getGenesisBlock = async function (client, channel) {
  let tx_id = client.newTransactionID()

  let request = {
    txId: tx_id
  }

  let genesisBlock = await channel.getGenesisBlock(request)

  return genesisBlock
}

var joinPeer = async function () {
  let client = await helper.getClient(true)
  let channel = await helper.getChannel(client)

  let genesisBlock = await getGenesisBlock(client, channel)

  let tx_id = client.newTransactionID()

  let request = {
    block: genesisBlock,
    txId: tx_id
  }

  let peers = helper.getOwnPeers(client)

  if (peers.length == 0) {
    console.log("can't find current org peers, please contact RTBAsia")
  }

  peers.forEach(function (peer) {
    channel.addPeer(peer)
  })

  return channel.joinChannel(request, 30000)
}

var main = async function () {
  await joinPeer()
}

main()
