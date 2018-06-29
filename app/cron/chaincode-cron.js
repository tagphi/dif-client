/* eslint-disable no-trailing-spaces,padded-blocks,no-new */

let CronJob = require('cron').CronJob
let CONFIG = require('../../config')
let downloader = require('../utils/download-utils')
var agent = require('superagent-promise')(require('superagent'), Promise)
let queryCC = require('../../query-installed-chaincode')
let path = require('path')
let adminApiBase = 'http://localhost:8080'
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
    let apiNewestCC = adminApiBase + '/static/cc_config.json'
    let resp = await agent.get(apiNewestCC).buffer()
    let newestCC = JSON.parse(resp.text)
    let newestCCVersionInt = parseInt(newestCC.version.replace('v', ''))

    // 查询本地peer上的已经安装的链码
    let localInstalledCCs = await queryCC.queryInstalledCC()
    let localLatestCC = localInstalledCCs.pop()
    let localLatestCCInt = parseInt(localLatestCC.version.replace('v', ''))

    if (newestCCVersionInt <= localLatestCCInt) return

    // 有较新的版本，下载并安装
    let ccPath = path.join(__dirname, '../../chaincode/build')
    let ccTmpPath = path.join(__dirname, '../../chaincode/tmp')
    let saveName = '/cc.tar.gz'

    // 下载链码包
    await downloader.downloadFile(newestCC.downloadUrl, ccTmpPath, saveName)
    // 解压
    await tar.xz(ccTmpPath + saveName, ccPath)
    await installCC.installChaincode(localLatestCC.name, newestCC.version, true)

    agent.post(adminApiBase + '/peer/reportPeerCC', {
      mspId: CONFIG.msp.id,
      cc: [{name: localLatestCC.name, version: newestCC.version}]
    })
  } catch (e) {
    console.log('chaincode sync err：', e)
    logger.error(e)
  }
}

exports.startCron = startCron

