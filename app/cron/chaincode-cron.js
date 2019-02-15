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
let logger = require('../utils/logger-utils').logger()

function startCron () {
  let cronTime = '*/' + CONFIG.site.cron.query_cc_install + ' * * * * *'
  new CronJob(cronTime, onTick, null, true, CONFIG.site.cron.timezone)
}

let isProcessing = false

async function onTick () {
  if (isProcessing) return

  isProcessing = true

  logger.info('chaincode sync ticking...')
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
      isProcessing = false
      return
    }

    let localLatestCCInt = _findLatestVersionOfInstalledCC(localInstalledCCs)

    if (remoteLatestCCVersionInt <= localLatestCCInt) {
      isProcessing = false
      return
    }

    // 有较新的版本，下载并安装
    await downloadAndInstallCC(remoteLatestCC)
  } catch (e) {
    isProcessing = false
    logger.error(`chaincode sync err：${e}`)
  }

  isProcessing = false
}

/**
 * 确定已经安装的最高版本的链码
 [{"name":"dif","version":"v10"},{"name":"dif","version":"v11"},{"name":"dif","version":"v12"},{"name":"dif","version":"v13"},{"name":"dif","version":"v14"},{"name":"dif","version":"v9"}]
 **/
function _findLatestVersionOfInstalledCC (installedCCs) {
  let latestVersion = -1
  installedCCs.forEach(function (cc) {
    let ccVersion = parseInt(cc.version.replace('v', ''))
    if (ccVersion > latestVersion) latestVersion = ccVersion
  })
  return latestVersion
}

async function downloadAndInstallCC (remoteLatestCC) {
  let msg = '---- download new version of chaincode ----'
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
  await installCC.installChaincode(remoteLatestCC.name, remoteLatestCC.version, remoteLatestCC.type)

  await agent.post(ADMIN_ADDR + '/peer/reportPeerCC', {
    mspId: CONFIG.msp.id,
    cc: [{name: remoteLatestCC.name, version: remoteLatestCC.version}]
  }).buffer()

  msg = 'Successfully install chaincode ——> name：' + remoteLatestCC.name + ' version：' + remoteLatestCC.version
  logger.info(msg)
}

exports.startCron = startCron
exports.onTick = onTick
