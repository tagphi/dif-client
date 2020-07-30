/* eslint-disable no-trailing-spaces,padded-blocks,no-new */

let logger = require('../utils/logger-utils').logger()

let CronJob = require('cron').CronJob

let CONFIG = require('../../config')
let ADMIN_ADDR = CONFIG.site.adminAddr

let queryCC = require('../../query-installed-chaincode')
let installCC = require('../../install-chaincode')

let downloader = require('../utils/download-utils')
let agent = require('superagent-promise')(require('superagent'), Promise)
let path = require('path')
let tar = require('../utils/tar-utils')
let cronUtil = require('./cron-util')

let isProcessing = false

function startCron () {
  new CronJob(cronUtil.cronTimeFromConfig(CONFIG.site.cron.query_cc_install),
    onTick, null, true, CONFIG.site.cron.timezone)
}

async function onTick () {
  if (isProcessing) return

  isProcessing = true
  logger.info('chaincode sync ticking...')

  try {
    // 查询服务端的最新链码
    let resp = await agent.get(ADMIN_ADDR + '/static/cc_config.json').buffer()
    let adminLatestCC = JSON.parse(resp.text)
    let adminLatestCCVersionInt = parseInt(adminLatestCC.version.replace('v', ''))

    // 查询本地peer上的已经安装的链码
    let localInstalledCCs = await queryCC.queryInstalledCC()

    if (!localInstalledCCs || localInstalledCCs.length === 0) { // 本地尚未安装链码
      logger.info(`chaincodes not existed,try to install from admin...`)
      await downloadAndInstallCC(adminLatestCC)
    } else { // 已有安装的链码，判断是否管理员端更新
      let localLatestCCInt = _findLatestVersionOfInstalledCC(localInstalledCCs)

      if (adminLatestCCVersionInt <= localLatestCCInt) logger.info(`chaincode not updated,current version:${localLatestCCInt}`)
      else {
        logger.info(`installing new version:${adminLatestCCVersionInt},from old:${localLatestCCInt}`)
        // 有较新的版本，下载并安装
        await downloadAndInstallCC(adminLatestCC)
      }
    }
  } catch (e) {
    logger.error(`chaincode sync err：${e}`)
  } finally {
    isProcessing = false
  }
}

/**
 * 确定已经安装的最高版本的链码
 [{"name":"dif","version":"v10"},{"name":"dif","version":"v11"},{"name":"dif","version":"v12"},{"name":"dif","version":"v13"},{"name":"dif","version":"v14"},{"name":"dif","version":"v9"}]
 **/
function _findLatestVersionOfInstalledCC (installedCCs) {
  let latestVersion = -1

  installedCCs.forEach(cc => {
    let ccVersion = parseInt(cc.version.replace('v', ''))

    if (ccVersion > latestVersion) latestVersion = ccVersion
  })

  return latestVersion
}

async function downloadAndInstallCC (remoteLatestCC) {
  logger.info('---- download new version of chaincode ----')

  let ccDir = remoteLatestCC.type === 'golang'
    ? path.join(__dirname, '../../chaincode/go/src')
    : path.join(__dirname, '../../chaincode/build')

  // 用于下载和解压
  let tmpPath = path.join(__dirname, '../../chaincode/tmp')
  let ccPkgName = 'cc.tar.gz'

  // 下载链码包
  await downloader.downloadFile(remoteLatestCC.downloadUrl, tmpPath, ccPkgName)
  // 解压
  await tar.xz(tmpPath + '/' + ccPkgName, ccDir)
  await installCC.installChaincode(remoteLatestCC.name, remoteLatestCC.version, remoteLatestCC.type)

  // 汇报给admin自己的版本进度
  await agent.post(ADMIN_ADDR + '/peer/reportPeerCC',
    {
      mspId: CONFIG.msp.id,
      cc: [{name: remoteLatestCC.name, version: remoteLatestCC.version}]
    }).buffer()

  logger.info('Successfully install chaincode ——> name：' + remoteLatestCC.name + ' version：' + remoteLatestCC.version)
}

exports.startCron = startCron
exports.onTick = onTick
