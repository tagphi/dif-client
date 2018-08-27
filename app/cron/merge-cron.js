/* eslint-disable no-trailing-spaces,padded-blocks,no-new */

let CronJob = require('cron').CronJob

let CONFIG = require('../../config')
let logger = require('../utils/logger-utils').logger
let commonUtils = require('util')

let blacklistService = require('../services/blacklist-service')
let queryCC = require('../cc/query')

const DATA_TYPES = ['device', 'ip', 'default']

let isRunning = false

function startCron () {
  if (isRunning) return
  isRunning = true
  let cronTime = '*/' + CONFIG.site.cron.merge_interval + ' * * * * *'
  new CronJob(cronTime, onTick, null, true, CONFIG.site.cron.timezone)
}

async function onTick () {
  try {
    // 取的最新版本
    let latestVersion = await queryCC('version', [])
    latestVersion = parseInt(latestVersion) + 1

    // 取的各类型的最新合并列表，并根据版本决定是否合并
    DATA_TYPES.forEach(_tryToMergeTypedList(latestVersion))
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
async function _getMergedListVersionByType (type) {
  // 查询最新的合并版本信息
  let mergedListIpfsInfo = await queryCC('getMergedList', [type])
  if (!mergedListIpfsInfo) return -1

  mergedListIpfsInfo = JSON.parse(mergedListIpfsInfo)
  return mergedListIpfsInfo.version
}

function _tryToMergeTypedList (latestVersion) {
  async function _asyncTryToMergeTypedList (type) {
    try {
      let typedMergedVersion = await _getMergedListVersionByType(type)
      if (latestVersion !== 1 && // 初始版本1，没有任何的上传和移除操作
        latestVersion > typedMergedVersion) { // 有新的版本时候，触发合并
        let msg = commonUtils.format('【%s】start merge:currentVersion-%d,latestVersion-%d',
          type, typedMergedVersion, latestVersion)
        logger.info(msg)

        await blacklistService.merge(type, latestVersion)

        msg = commonUtils.format('[%s] success merge:from %d to %d',
          type, typedMergedVersion, latestVersion)
        logger.info(msg)
      }

    } catch (e) {
      let err = commonUtils.format('[%s] failed to merge to %d', type, latestVersion)
      logger.error(err)
      logger.error(e)
    }
  }

  return _asyncTryToMergeTypedList
}

exports.startCron = startCron
exports.onTick = onTick
