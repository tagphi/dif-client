/* eslint-disable no-trailing-spaces,node/no-deprecated-api */

let CONFIG = require('../../../config')
const CONFIG__SITE = CONFIG.site
const CONFIG__MSP = CONFIG.msp
const CONFIG_IPFS = CONFIG__SITE.ipfs
const ADMIN_ADDR = CONFIG__SITE.adminAddr
var MERGE_SERVICE_URL = CONFIG__SITE.mergeServiceUrl

var respUtils = require('../../utils/resp-utils')
var logger = require('../../utils/logger-utils').logger()

var {check} = require('express-validator/check')
var agent = require('superagent-promise')(require('superagent'), Promise)
let ipfsCliRemote = require('../../utils/ipfs-cli-remote').bind(CONFIG_IPFS.host, CONFIG_IPFS.port)

var queryChaincode = require('../../cc/query')
var invokeCC = require('../../cc/invoke')

let blacklistService = require('../../services/blacklist-service')
let mergeCron = require('../../cron/merge-cron')

exports.url = '/blacklist'
exports.excludeHandlers = ['upload']

/**
 * 上传黑名单/移除列表
 **/
exports.validateUpload = [
  check('dataType').not().isEmpty().withMessage('dataType不能为空'),
  check('type').not().isEmpty().withMessage('类型type不能为空')
]

exports.upload = async function (req, res) {
  let type = req.body.type
  let dataType = req.body.dataType
  let dataListBuf = req.file.buffer
  let filename = req.file.originalname.toString()
  let size = req.file.size

  let uploadTime = new Date().getTime().toString()

  if (dataType === 'appeal') {
    await uploadAppeal(req, res)
  } else {
    /* 媒体ip */
    if (type === 'publisherIp') { // 媒体ip
      await blacklistService.submitPublishIPs(uploadTime, filename, size, dataListBuf)
      respUtils.succResponse(res, '上传成功')
      return
    }

    await uploadBlacklist(req, res)
  }
}

async function uploadAppeal (req, res) {
  let type = req.body.type
  let summary = req.body.summary
  let dataListBuf = req.file.buffer
  let filename = req.file.originalname.toString()
  let size = req.file.size

  let uploadTime = new Date().getTime().toString()

  if (!summary || summary.length === 0) {
    return respUtils.errResonse(res, 'summary not exists')
  }

  await blacklistService.submitAppeal(uploadTime, type, filename, size, dataListBuf, summary)
  respUtils.succResponse(res, '上传成功')
}

async function uploadBlacklist (req, res) {
  let type = req.body.type
  let dataListBuf = req.file.buffer
  let filename = req.file.originalname.toString()
  let size = req.file.size

  let locked = await blacklistService.isLocked()
  logger.info(`lock status:${locked}`)

  if (locked) {
    return respUtils.errResonse(res, '锁定期不能提交黑名单')
  }

  await blacklistService.uploadBlacklist(filename, size, dataListBuf, type)
  respUtils.succResponse(res, '上传成功')
}

exports.getMergedRmList = async function (req, res, next) {
  let type = req.body.type

  let mergedRmList = await blacklistService.getMergedRmList(type)

  let response = ''

  if (mergedRmList != null) {
    for (let record in mergedRmList) {
      let firstOrg = true

      response += record + ':'

      let orgs = mergedRmList[record]

      orgs.forEach(function (org) {
        if (!firstOrg) {
          response += ','
          firstOrg = false
        }

        response += org
      })

      response += '\n'
    }
  }

  respUtils.download(res, 'remove_list_' + type + 'latest.txt', response)
}

/**
 * 下载黑名单
 *
 * result 示例
 device1    IMEI    MD5    1
 device2    IMEI    MD5    1
 **/
exports.validateDownload = [
  check('name').not().isEmpty().withMessage('name不能为空'),
  check('path').not().isEmpty().withMessage('path不能为空')
]

exports.download = async function (req, res, next) {
  let path = req.query.path
  let name = req.query.name

  try {
    downloadIpfsFile(res, name, path)
  } catch (e) {
    logger.error(e)
    respUtils.download(res, name, '下载出错')
  }
}

/**
 * 从job服务器下载ipfs并返回给客户端
 **/
function downloadIpfsFile (res, name, path) {
  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename=' + name
  })
  agent.get(`${MERGE_SERVICE_URL}/download/${path}`)
    .pipe(res)
  logger.info('downloading file:' + name)
}

/**
 * 从job服务器下载ipfs并返回给客户端
 **/
function downloadZipfile (res, name, files) {
  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename=' + name
  })
  agent.post(`${MERGE_SERVICE_URL}/batchDownload`)
    .send(files)
    .pipe(res)

  logger.info('downloading file:' + name)
}

/**
 * 下载合并列表
 *
 * result 示例
 {"device1\tIMEI\tMD5":["RTBAsia"],"device2\tIMEI\tMD5":["RTBAsia"]}
 **/
exports.validateDownloadMergedlist = [
  check('type').not().isEmpty().withMessage('type不能为空')
]

/**
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
exports.downloadMergedlist = async function (req, res, next) {
  let type = req.query.type
  let filename = type + '-merged-' + new Date().getTime() + '.txt'

  try {
    // 查询最新的合并版本信息
    let mergedListIpfsInfo = await queryChaincode('getMergedList', [type])
    if (!mergedListIpfsInfo) return respUtils.download(res, filename, '暂无数据')

    // 从ipfs上下载
    mergedListIpfsInfo = JSON.parse(mergedListIpfsInfo)
    downloadIpfsFile(res, filename, mergedListIpfsInfo.ipfsInfo.path)
  } catch (e) {
    logger.error(e)
    respUtils.download(res, filename, '下载合并版本出错')
  }
}

/**
 * 版本信息
 **/
exports.versionInfo = async function (req, res, next) {
  let versionInfo = {}
  // 获取最新生产版本信息
  let mergedListInfo = await queryChaincode('getMergedList', ['device'])

  if (!mergedListInfo) {
    mergedListInfo = '{}'
  }

  mergedListInfo = JSON.parse(mergedListInfo)

  if (mergedListInfo.ipfsInfo && mergedListInfo.ipfsInfo.name) {
    let mergedTimestamp = mergedListInfo.ipfsInfo.name.replace('.log', '').split('-')[1]
    versionInfo.pubDate = new Date(parseInt(mergedTimestamp))
  }

  // 预测下个版本发布日期
  let nextPubDate = publishDate()

  if (new Date().getTime() > nextPubDate.getTime()) {
    nextPubDate = publishDate(1)
  }

  versionInfo.nextPubDate = nextPubDate

  respUtils.succResponse(res, '获取版本', versionInfo)
}

function publishDate (monthOffset) {
  monthOffset = monthOffset || 0

  let date = new Date()
  let year = date.getFullYear()
  let month = date.getMonth()
  let curMothDate = new Date(year, month + monthOffset, 20)
  return curMothDate
}

//  env=prod&types=publisher_ip,default,ip,device,domain
exports.validateDownloadByEnv = [
  check('env').not().isEmpty().withMessage('env不能为空'),
  check('types').not().isEmpty().withMessage('types不能为空')
]

exports.downloadByEnv = async function (req, res, next) {
  let env = req.query.env
  let types = req.query.types

  let typesList = types.split(',')

  if (typesList.length === 0) {
    return respUtils.errResonse(res, '未选择要下载的黑名单类型')
  }

  if (env !== 'prod' && env !== 'dev') {
    return respUtils.errResonse(res, '不支持的黑名单版本')
  }

  let filesList

  if (env === 'prod') {
    filesList = await prodFileinfosForTypes(typesList)
  } else if (env === 'dev') {
    filesList = await devFileinfosForTypes(typesList)
  }

  if (filesList.length !== 0) {
    let versionInDate = filesList[0].fileName.replace('.log', '').split('-')[1]
    downloadZipfile(res, env + '-' + versionInDate + '.zip', filesList)
  } else {
    return respUtils.errResonse(res, '该版本没有最新的黑名单')
  }
}

/**
 * 生产环境要下载合并文件列表
 **/
async function prodFileinfosForTypes (typesList) {
  let pathinfoList = []

  for (let i = 0; i < typesList.length; i++) {
    try {
      let type = typesList[i]

      // 获取最新生产版本信息
      let mergedListInfo = await queryChaincode('getMergedList', [type])

      mergedListInfo = mergedListInfo || '{}'
      mergedListInfo = JSON.parse(mergedListInfo)

      let ipfsinfo = mergedListInfo.ipfsInfo

      if (ipfsinfo) {
        pathinfoList.push({
          fileName: type + '-' + versionFromName(ipfsinfo.name) + '.log',
          hash: ipfsinfo.hash
        })
      }
    } catch (e) {
      logger.error(e)
      continue
    }
  }

  return pathinfoList
}

function versionFromName (filename) {
  if (!filename) {
    return new Date().getTime()
  }

  let timestamp = filename.replace('.log', '').split('-')[1]
  let pubDate = new Date(parseInt(timestamp))
  let month = pubDate.getMonth() + 1

  if (month < 10) {
    month = '0' + month
  }

  let version = pubDate.getFullYear() + '' + month + '' + pubDate.getDate()

  return version
}

/**
 * 实验环境要下载合并文件列表
 **/
async function devFileinfosForTypes (typesList) {
  let pathinfoList = []

  for (let i = 0; i < typesList.length; i++) {
    let type = typesList[i]

    try {
      let historiesList = await queryChaincode('getMergedHistoryList', [type])

      if (!historiesList || historiesList.toLowerCase().indexOf('error') !== -1) {
        continue
      }

      historiesList = JSON.parse(historiesList)

      // 时间逆序
      historiesList.sort(function (item1, item2) {
        return parseInt(item2.timestamp) - parseInt(item1.timestamp)
      })

      // 最新的合并历史的ipfs信息
      let ipfsinfo = historiesList[0].ipfsInfo.ipfsInfo

      pathinfoList.push({
        fileName: type + '-' + versionFromName(ipfsinfo.name) + '.log',
        hash: ipfsinfo.hash
      })
    } catch (e) {
      logger.error(e)
      continue
    }
  }

  return pathinfoList
}

/**
 * 下载真实的ip
 **/
exports.downloadRealIPs = async function (req, res, next) {
  let resp = await agent.get(ADMIN_ADDR + '/peer/downloadRealIPs').buffer()
  let realIPsInfo = JSON.parse(resp.text)
  if (!realIPsInfo.path) return respUtils.download(res, `real-ips-${new Date().getTime()}.txt`, '暂无脱水ip')
  let realIPFileInfo = await ipfsCliRemote.get(realIPsInfo.path, realIPsInfo.name)
  let realIps = realIPFileInfo.content.toString()
  respUtils.download(res, realIPsInfo.name, realIps)
}

/**
 * 下载媒体ip接口
 **/
exports.validateDownloadPublishIPs = [
  check('mspId').not().isEmpty().withMessage('mspId不能为空')
]

exports.downloadPublishIPs = async function (req, res, next) {
  let mspId = req.query.mspId
  let filename = mspId + '-publisher-ips-' + new Date().getTime() + '.txt'

  try {
    let publisherIPsRecord = await queryChaincode('getPublisherIpByMspId', [mspId])
    if (!publisherIPsRecord) return respUtils.download(res, filename, '暂无数据')

    publisherIPsRecord = JSON.parse(publisherIPsRecord)
    publisherIPsRecord.ipfsInfo = JSON.parse(publisherIPsRecord.ipfsInfo)
    downloadIpfsFile(res, filename, publisherIPsRecord.ipfsInfo.path)
  } catch (e) {
    logger.error(e)
    respUtils.download(res, filename, '下载媒体IP出错')
  }
}

/**
 * 获取上传/移除历史
 *
 result 示例：
 [
 {
   timestamp: '1531269985958',
   mspid: 'RTBAsia',
   type: 'device',
   ipfsInfo:
    {
      hash: 'hashhash',
      path: 'somewhereinipfs/filename.ext',
      name: 'filename.ext',
      size: 888
    }
 }
 ]
 **/
exports.validateHistories = [
  check('dataType').not().isEmpty().withMessage('dataType不能为空'),
  check('startDate').not().isEmpty().withMessage('开始日期不能为空'),
  check('endDate').not().isEmpty().withMessage('结束日期不能为空')
]

/**
 * 查询历史
 申诉历史 示例：
 [
 {
     "timestamp": "1534994441172",
     "mspid": "RTBAsia",
     "type": "ip",
     "details": {
         "ipfsInfo": "{\"path\":\"QmQgfZqtQSAkoWc3iF5wk4ceUqwjnz2kiVuQ93PMaLfKLq\",\"hash\":\"QmQgfZqtQSAkoWc3iF5wk4ceUqwjnz2kiVuQ93PMaLfKLq\",\"size\":37,\"name\":\"ip-1534994432534.txt\"}",
         "summary": "被黑了",
         "key": "\u0000V9_VERSION\u00001534994441172\u0000RTBAsia\u0000ip\u0000",
         "agree": [],
         "against": [],
         "status": 0
     }
 }....
 ]
 **/
exports.histories = async function (req, res, next) {
  let dataType = req.body.dataType
  let startTimestamp = Date.parse(req.body.startDate) + ''
  let endTimestamp = Date.parse(req.body.endDate) + ''

  let pageNO = req.body.pageNO || 1

  let result

  if (dataType === 'delta') {
    result = await queryChaincode('listDeltaUploadHistory', [startTimestamp, endTimestamp]) || '[]'
  } else if (dataType === 'appeal') {
    result = await queryChaincode('listAppeals', [startTimestamp, endTimestamp])
  } else {
    throw new Error('未知的数据类型:' + dataType)
  }

  logger.debug(`listDeltaUploadHistory -dataType:${dataType} result:${result}`)

  if (result.indexOf('Err') !== -1) return next(result)

  result = JSON.parse(result)
  // 时间逆序
  result.sort(function (item1, item2) {
    return parseInt(item2.timestamp) - parseInt(item1.timestamp)
  })

  if (dataType === 'appeal') { // 申诉 --> 转化每一个key
    result.map(function (appeal) {
      let appealDetails = appeal.details
      appeal.details.key = Buffer.from(appealDetails.key).toString('base64')

      // 检查自己是否已经投过票
      let selfMspid = CONFIG__MSP.id
      if (appealDetails.agree.indexOf(selfMspid) !== -1 ||
        appealDetails.against.indexOf(selfMspid) !== -1) {
        appeal.selfVoted = true
      }
    })
  }
  respUtils.page(res, result, pageNO)
}

/**
 * 查询合并版本历史
 result eg:
 [{"timestamp":"1536819883948","version":"2","ipfsInfo":{"version":2,"ipfsInfo":{"path":"QmYuNupvr9cBeSBo7sr1EgdthshSDFuXCM1Fw5oYDrgVoo","hash":"QmYuNupvr9cBeSBo7sr1EgdthshSDFuXCM1Fw5oYDrgVoo","size":260,"name":"device-merged-1536819877325.txt"}}}]
 **/
exports.validateMergedHistories = [
  check('type').not().isEmpty().withMessage('type不能为空')
]

exports.mergedHistories = async function (req, res, next) {
  let type = req.body.type

  let result = await queryChaincode('getMergedHistoryList', [type])
  if (result.indexOf('Err') !== -1) return next(result)
  result = JSON.parse(result)
  // 时间逆序
  result.sort(function (item1, item2) {
    return parseInt(item2.timestamp) - parseInt(item1.timestamp)
  })
  respUtils.succResponse(res, '获取成功', result)
}

/**
 * 获取媒体ip列表
 *
 **/
exports.validatePublisherIPs = [
  check('pageNO').not().isEmpty().withMessage('pageNO不能为空')
]

exports.publisherIPs = async function (req, res, next) {
  let pageNO = req.body.pageNO
  // [{"mspId":"RTBAsia","timestamp":"1535951671633","lines":2}]
  let result = await queryChaincode('getPublishers', [])

  if (result.indexOf('Err') !== -1) return next(result)

  result = JSON.parse(result)
  result.forEach(function (record) {
    record.ipfsInfo = JSON.parse(record.ipfsInfo)
  })
  // 时间逆序
  result.sort(function (item1, item2) {
    return parseInt(item2.timestamp) - parseInt(item1.timestamp)
  })

  respUtils.page(res, result, pageNO)
}

exports.mergeManually = async function (req, res, next) {
  if (CONFIG__SITE.dev) {
    let result = await mergeCron.onTick()
    respUtils.succResponse(res, result)
  }
}

/**
 * 给指定的申诉记录投票
 **/
exports.validateVoteAppeal = [
  check('key').not().isEmpty().withMessage('key不能为空'),
  check('action').not().isEmpty().withMessage('action不能为空')
]

exports.voteAppeal = async function (req, res, next) {
  let key = new Buffer(req.body.key, 'base64').toString()
  let action = req.body.action

  let result = await invokeCC('voteAppeal', [action, key])
  if (result && result.indexOf('Err') !== -1) return next(result)

  respUtils.succResponse(res, '投票成功')
}

/**
 * 回调接口
 **/
exports.callback = async function (req, res) {
  let cmd = req.body.cmd
  let args = req.body.args

  if (!blacklistService[cmd]) return respUtils.succResponse(res)

  let result = await blacklistService[cmd](args, req.body)
  if (result) {
    respUtils.succResponse(res, `success to call ${cmd}(${JSON.stringify(args)})`)
    logger.info(`success to call  ${cmd}(${JSON.stringify(args)})`)
  } else {
    respUtils.errResonse(res, `error to call  ${cmd}(${JSON.stringify(args)})`)
    logger.info(`error to call  ${cmd}(${JSON.stringify(args)})`)
  }
}

/**
 * 任务历史接口
 **/
exports.jobs = async function (req, res) {
  let start = req.body.start || 0
  let end = req.body.end || 10

  let jobsResults = await agent
    .get(`${MERGE_SERVICE_URL}/jobs?start=${start}&end=${end}`)
    .buffer()
  jobsResults = JSON.parse(jobsResults.text)

  respUtils.succResponse(res, undefined, jobsResults)
}

/**
 * 锁定接口
 **/
exports.isLocked = async function (req, res) {
  const locked = await blacklistService.isLocked()
  respUtils.succResponse(res, '查询成功', {
    locked
  })
}
