/* eslint-disable no-trailing-spaces,padded-blocks,no-new */

let CronJob = require('cron').CronJob

let CONFIG = require('../../config')
let logger = require('../utils/logger-utils').logger()

let blacklistService = require('../services/blacklist-service')
let queryCC = require('../cc/query')

const DATA_TYPES = [
  {type: 'device', merging: false},
  {type: 'ip', merging: false},
  {type: 'default', merging: false}]

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
    latestVersion = parseInt(latestVersion)

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
  let mergedListIpfsInfo = await queryCC('getOrgMergeList', [type])
  if (!mergedListIpfsInfo) return -1

  mergedListIpfsInfo = JSON.parse(mergedListIpfsInfo)
  return mergedListIpfsInfo.version
}

function _tryToMergeTypedList (latestVersion) {
  async function _asyncTryToMergeTypedList (typeItem) {
    try {
      let typedMergedVersion = await _getMergedListVersionByType(typeItem.type)

      if (latestVersion !== 0 && // 初始版本1，没有任何的上传和移除操作
        latestVersion > typedMergedVersion) { // 有新的版本时候，触发合并
        if (typeItem.merging) return
        typeItem.merging = true
        logger.info(`[${typeItem.type}] start merge:currentVersion-${typedMergedVersion},latestVersion-${latestVersion}`)

        await blacklistService.merge(typeItem.type, latestVersion)
        typeItem.merging = false

        logger.info(`[${typeItem.type}] success merge:from ${typedMergedVersion} to ${latestVersion}`)
      }

    } catch (e) {
      logger.error(`[${typeItem.type}] failed to merge to ${latestVersion}:${e}`)
      typeItem.merging = false
    }
  }

  return _asyncTryToMergeTypedList
}

exports.startCron = startCron
exports.onTick = onTick
