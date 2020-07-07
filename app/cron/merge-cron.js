/* eslint-disable no-trailing-spaces,padded-blocks,no-new */

let CronJob = require('cron').CronJob

let CONFIG = require('../../config')
let logger = require('../utils/logger-utils').logger()

let blacklistService = require('../services/blacklist-service')
let queryCC = require('../cc/query')

const DATA_TYPES = [
  {type: 'default', merging: false},

  {type: 'ip', merging: false},
  {type: 'domain', merging: false},

  {type: 'ua_spider', merging: false},
  {type: 'ua_client', merging: false}
]

const TYPE_DEVICE = {type: 'device', merging: false}

let isRunning = false

function startCron () {
  if (isRunning) return
  isRunning = true
  let cronTime = cronTimeFromConfig(CONFIG.site.cron.merge_interval)
  new CronJob(cronTime, onTick, null, true, CONFIG.site.cron.timezone)
}

function cronTimeFromConfig (configTime) {
  configTime += ''

  if (configTime.indexOf('*') !== -1) {
    return configTime
  } else {
    return '*/' + configTime + ' * * * * *'
  }
}

/*
* 合并指定的类型
* @param item 格式{type: 'default', merging: false}
* */
async function mergeType (item) {
  let isUA = item.type.indexOf('ua') !== -1

  // 取的最新版本
  let latestVersion = await queryCC('version', [isUA + '']) // ua查出来ua对应的最新版本，其他名单的提交不受影响
  latestVersion = parseInt(latestVersion)

  try {
    let typedMergedVersion = await getMergedVersionByType(item.type)
    logger.info(`[${item.type}] latestVersion-${latestVersion},typedMergedVersion-${typedMergedVersion}`)

    if (latestVersion === 0 || // 初始版本1，没有任何的上传和移除操作
      latestVersion <= typedMergedVersion) { // 没有新的版本
      return;
    }

    if (item.merging) return;

    item.merging = true
    logger.info(`[${item.type}] start merge:currentVersion-${typedMergedVersion},latestVersion-${latestVersion}`)

    await blacklistService.merge(item.type, latestVersion)
    item.merging = false

    logger.info(`[${item.type}] success merge:from ${typedMergedVersion} to ${latestVersion}`)
  } catch (e) {
    logger.error(`[${item.type}] failed to merge to ${latestVersion}:${e}`)
    item.merging = false
  }
}

/*
* 合并device，因为需要在default合并成功后再去触发merge
* */
async function mergeDevice () {
  await mergeType(TYPE_DEVICE)
}

async function onTick () {
  try {
    logger.info('merge cron ticking...')

    // 取的各类型的最新合并列表，并根据版本决定是否合并
    for (item of DATA_TYPES) {
      await mergeType(item)
    }
  } catch (e) {
    logger.error('merge cron err', e)
  }
}

/**
 *
 mergedListIpfsInfo 示例
 {
    "version": 2,
    "ipfsInfo": {
        "path": "QmX96yBwjpwjUrdX64oKkNjUSQ4d7YYyayumsT6ZBpoyiw",
        "hash": "QmX96yBwjpwjUrdX64oKkNjUSQ4d7YYyayumsT6ZBpoyiw",
        "size": 1060314,
        "name": "device-merged-1531304509027.txt"
    }
}
 **/
async function getMergedVersionByType (type) {
  // 查询最新的合并版本信息
  let mergedListIpfsInfo = await queryCC('getOrgMergeList', [type])
  if (!mergedListIpfsInfo) return -1

  mergedListIpfsInfo = JSON.parse(mergedListIpfsInfo)
  return mergedListIpfsInfo.version
}


exports.startCron = startCron
exports.onTick = onTick
exports.mergeDevice = mergeDevice
