let logger = require('../utils/logger-utils').logger()

/*
* 从自动发现信息中提取背书的目标节点
*
* @param client 用于访问peer和
* */
function extractTargetsFromDiscover (client, discoveryResults, CONFIG) {
  let difPlan = discoveryResults.endorsement_targets.dif
  let difLayouts = difPlan.layouts
  let difGroups = difPlan.groups

  let endorserPeers = []

  for (let i = 0; i < difLayouts.length; i++) {
    let groupPeers = difGroups['G' + i]['peers']
    endorserPeers = endorserPeers.concat(groupPeers)
  }

  let targets = []

  endorserPeers.forEach(endorser => {
    let connOptions = {
      name: endorser.name,
      'request-timeout': CONFIG.peer['request_timeout'],
      'ssl-target-name-override': endorser.name
    }
    
    targets.push(client.newPeer('grpc://' + endorser.endpoint, connOptions))
  })

  logger.info(`discovered endorser peers:` + JSON.stringify(difGroups))
  return targets
}

exports.extractTargetsFromDiscover = extractTargetsFromDiscover
