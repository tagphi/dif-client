/* eslint-disable no-trailing-spaces,padded-blocks,no-new */

let CronJob = require('cron').CronJob

let CONFIG = require('../../config')
let ADMIN_ADDR = CONFIG.site.adminAddr
let logger = require('../utils/logger-utils').logger()
let agent = require('superagent-promise')(require('superagent'), Promise)
let cronUtil = require('./cron-util')

let isRunning = false

function startCron () {
  if (isRunning) return

  isRunning = true

  let cronTime = cronUtil.cronTimeFromConfig(CONFIG.site.cron.heartbeat_interval)
  new CronJob(cronTime, onTick, null, true, CONFIG.site.cron.timezone)
}

async function onTick () {
  try {
    logger.info('heartbeat cron ticking...')

    // 定时心跳，汇报自己的版本
    let resp = await agent.post(ADMIN_ADDR + '/peer/heartBeat', {
      mspId: CONFIG.msp.id,
      clientVersion: CONFIG.site.version
    }).buffer()

    logger.info(`heartbeat cron result:${resp.text}`)
  } catch (e) {
    logger.error('heartbeat cron err', e)
  }
}

exports.startCron = startCron
exports.onTick = onTick