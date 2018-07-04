/* eslint-disable no-trailing-spaces,padded-blocks,no-new */

let CronJob = require('cron').CronJob
let CONFIG = require('../../config')
let ADMIN_ADDR = CONFIG.site.adminAddr
let downloader = require('../utils/download-utils')
var agent = require('superagent-promise')(require('superagent'), Promise)
let queryCC = require('../../query-installed-chaincode')
let path = require('path')
let installCC = require('../../install-chaincode')
let tar = require('../utils/tar-utils')
let logger = require('../utils/logger-utils').logger

function startCron () {
  let cronTime = '*/' + CONFIG.site.cron.query_cc_install + ' * * * * *'
  new CronJob(cronTime, onTick, null, true, CONFIG.site.cron.timezone)
}

async function onTick () {
  try {
    // 查询服务端的最新链码
    let apiNewestCC = ADMIN_ADDR + '/static/cc_config.json'
    let resp = await agent.get(apiNewestCC).buffer()
    let remoteLatestCC = JSON.parse(resp.text)
    let remoteLatestCCVersionInt = parseInt(remoteLatestCC.version.replace('v', ''))

    // 查询本地peer上的已经安装的链码
    let localInstalledCCs = await queryCC.queryInstalledCC()
    if (!localInstalledCCs || localInstalledCCs.length === 0) { // 本地尚未安装链码
      await downloadAndInstallCC(remoteLatestCC)
      return
    }

    let localLatestCC = localInstalledCCs.pop()
    let localLatestCCInt = parseInt(localLatestCC.version.replace('v', ''))

    if (remoteLatestCCVersionInt <= localLatestCCInt) return

    // 有较新的版本，下载并安装
    await downloadAndInstallCC(remoteLatestCC)
  } catch (e) {
    console.log('chaincode sync err：', e)
    logger.error(e)
  }
}

async function downloadAndInstallCC (remoteLatestCC) {
  let msg = '---- download new version of chaincode ----'
  console.log(msg)
  logger.info(msg)

  let ccPath = path.join(__dirname, '../../chaincode/build')
  if (remoteLatestCC.type === 'golang') {
    ccPath = path.join(__dirname, '../../chaincode/go/src')
  }
  let ccTmpPath = path.join(__dirname, '../../chaincode/tmp')
  let saveName = 'cc.tar.gz'

  // 下载链码包
  await downloader.downloadFile(remoteLatestCC.downloadUrl, ccTmpPath, saveName)
  // 解压
  await tar.xz(ccTmpPath + '/' + saveName, ccPath)
  await installCC.installChaincode(remoteLatestCC.name, remoteLatestCC.version,remoteLatestCC.type)

  await agent.post(ADMIN_ADDR + '/peer/reportPeerCC', {
    mspId: CONFIG.msp.id,
    cc: [{name: remoteLatestCC.name, version: remoteLatestCC.version}]
  }).buffer()

  msg = 'Successfully install chaincode ——> name：' + remoteLatestCC.name + ' version：' + remoteLatestCC.version
  console.log(msg)
  logger.info(msg)
}

async function isEndorer () {
  let resp = await agent.post(ADMIN_ADDR + '/peer/peers2').buffer()
  let orgs = JSON.parse(resp.text)
  let orgMspId = CONFIG.msp.id
  for (let i in orgs) {
    let org = orgs[i]
    if (org.MSPID === orgMspId) {
      let localPeer = org.peers[0]
      return localPeer.endorser
    }
  }

  return false
}

exports.startCron = startCron
exports.isEndorer = isEndorer
