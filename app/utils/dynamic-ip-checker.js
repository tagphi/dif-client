/**
 * 动态ip检查器
 **/
var agent = require('superagent-promise')(require('superagent'), Promise)

async function isDynamicIP (ip) {
  let reqParams = {
    key: 'HIMABID',
    ip: ip,
    r: '1'
  }

  let resp = await agent.get('https://api.rtbasia.com/ipscore/query', reqParams).buffer()
  let result = JSON.parse(resp.text)[0]
  return result.type === '4'
}

exports.isDynamicIP = isDynamicIP
