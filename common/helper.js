'use strict'

var Client = require('fabric-client')
var CONFIG = require('../config.json')
var path = require('path')
var fs = require('fs-extra')

var getChannel = async function (client) {
  let channel = client.newChannel(CONFIG.channel_name)

  let orderer = __newOrderer(client)
  channel.addOrderer(orderer)

  return channel
}

var __newOrderer = function (client) {
  let data = fs.readFileSync(path.join(__dirname, CONFIG.orderer.tls_cert_path))
  let caroots = Buffer.from(data).toString()

  return client.newOrderer(CONFIG.orderer.url, {
    'pem': caroots,
    'ssl-target-name-override': CONFIG.orderer.ssl_target_name_override,
    'request-timeout': CONFIG.orderer.timeout
  })
}

var __readAllFiles = function (dir) {
  var files = fs.readdirSync(dir)
  var certs = []

  files.forEach((fileName) => {
    let filePath = path.join(dir, fileName)
    let data = fs.readFileSync(filePath)
    certs.push(data)
  })

  return certs
}

var __getCryptoDataPEM = function (keyPath) {
  let pem = Buffer.from(__readAllFiles(keyPath)[0]).toString()

  return pem
}

var __setAdminSigningIdentity = function (client) {
  // set admin identity
  var keyPEM = __getCryptoDataPEM(path.join(__dirname, CONFIG.msp.admin_key_path))
  var certPEM = __getCryptoDataPEM(path.join(__dirname, CONFIG.msp.admin_cert_path))

  client.setAdminSigningIdentity(keyPEM, certPEM, CONFIG.msp.id)
}

var getClient = async function (useAdmin) {
  let client = new Client()
  let store = await Client.newDefaultKeyValueStore({
    path: CONFIG.site.key_value_store
  })

  client.setStateStore(store)

  await __setUserContext(client, useAdmin)

  __setAdminSigningIdentity(client)

  return client
}

var __setUserContext = async function (client, useAdmin) {
  let username = useAdmin ? 'admin' : 'user1'
  let user = await client.getUserContext(username, true)

  if (user === null) {
    var privateKeyPEM = null
    var signedCertPEM = null

    if (useAdmin) { // 使用admin的证书登记此user
      privateKeyPEM = __getCryptoDataPEM(path.join(__dirname, CONFIG.msp.admin_key_path))
      signedCertPEM = __getCryptoDataPEM(path.join(__dirname, CONFIG.msp.admin_cert_path))
    } else {
      privateKeyPEM = __getCryptoDataPEM(path.join(__dirname, CONFIG.msp.prv_key_path))
      signedCertPEM = __getCryptoDataPEM(path.join(__dirname, CONFIG.msp.sgn_cert_path))
    }

    user = await client.createUser({
      username: username,
      mspid: CONFIG.msp.id,
      cryptoContent: {privateKeyPEM: privateKeyPEM, signedCertPEM: signedCertPEM}
    })
  }

  return user
}

// var __getPeersConfig = async function () {
//   let resp = await agent.post('http://localhost:8080/peer/peers2').buffer()
//   let peers = JSON.parse(resp.text);
//   return peers
// }

var __getPeersConfig = function () {
  let allPeersJsonStr = fs.readFileSync(path.join(__dirname, '../peers.json'))
  let allPeersJson = JSON.parse(Buffer.from(allPeersJsonStr).toString())

  return allPeersJson
}

var getEndorsers = function (client) {
  let allPeersJson = __getPeersConfig()
  let endorsers = []

  let data = fs.readFileSync(path.join(__dirname, CONFIG.peer.tls_cert_path))

  for (let key in allPeersJson) {
    let orgPeersJson = allPeersJson[key]

    for (let key in orgPeersJson.peers) {
      let peerConfig = orgPeersJson.peers[key]

      if (peerConfig.endorser) {
        let connOptions = {
          pem: Buffer.from(data).toString(), // TODO: tls证书是必须的，但是我们不一定开启了tls验证
          'request-timeout': 120 // TODO: 从配置中读取
        }

        if ('ssl-target-name-override' in peerConfig) {
          connOptions['ssl-target-name-override'] = peerConfig['ssl-target-name-override']
        }

        let peer = client.newPeer(
          orgPeersJson.peers[key].url,
          connOptions
        )

        endorsers.push(peer)
      }
    }
  }

  return endorsers
}

var getOwnPeers = function (client) {
  let allPeersJson = __getPeersConfig()

  let peers = []

  for (let key in allPeersJson) {
    let orgPeersJson = allPeersJson[key]

    // 这是本组织Peer
    if (orgPeersJson.MSPID === CONFIG.msp.id) {
      let data = fs.readFileSync(path.join(__dirname, CONFIG.peer.tls_cert_path))

      for (let key in orgPeersJson.peers) {
        let peerConfig = orgPeersJson.peers[key]

        let connOptions = {
          pem: Buffer.from(data).toString(), // TODO: tls证书是必须的，但是我们不一定开启了tls验证
          'request-timeout': 120 // TODO: 从配置中读取
        }

        if ('ssl-target-name-override' in peerConfig) {
          connOptions['ssl-target-name-override'] = peerConfig['ssl-target-name-override']
        }

        let peer = client.newPeer(
          orgPeersJson.peers[key].url,
          connOptions
        )

        peers.push(peer)
      }
    }
  }

  return peers
}

exports.getClient = getClient
exports.getChannel = getChannel
exports.getOwnPeers = getOwnPeers
exports.getEndorsers = getEndorsers
