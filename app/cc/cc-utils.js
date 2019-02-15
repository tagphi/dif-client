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
  endorserPeers.forEach(function (endorser) {
    let connOptions = {
      name: endorser.name,
      'request-timeout': CONFIG.peer['request_timeout'],
      'ssl-target-name-override': endorser.name
    }
    let url = 'grpc://' + endorser.endpoint

    let peer = client.newPeer(url, connOptions)
    targets.push(peer)
  })

  return targets
}

exports.extractTargetsFromDiscover = extractTargetsFromDiscover
