/* eslint-disable no-trailing-spaces,node/no-deprecated-api */

let CONFIG = require('../../../config')
const CONFIG__SITE = CONFIG.site

let MERGE_SERVICE_URL = CONFIG__SITE.mergeServiceUrl

let logger = require('../../utils/logger-utils').logger()

let {check} = require('express-validator/check')

let {download, err, ok, page} = require('../../utils/resp-utils')

let agent = require('superagent-promise')(require('superagent'), Promise)

const CONFIG_IPFS = CONFIG__SITE.ipfs
let ipfsCliRemote = require('../../utils/ipfs-cli-remote').bind(CONFIG_IPFS.host, CONFIG_IPFS.port)

let queryCC = require('../../cc/query')
let invokeCC = require('../../cc/invoke')

let blacklistService = require('../../services/blacklist-service')
let mergeCron = require('../../cron/merge-cron')

// 时间逆序
let descByTime = (item1, item2) => parseInt(item2.timestamp) - parseInt(item1.timestamp)

exports.url = '/blacklist'
exports.excludeHandlers = ['upload']

/**
 * 上传黑名单/移除列表
 **/
exports.validateUpload = [
  check('dataType').not().isEmpty().withMessage('dataType不能为空'),
  check('type').not().isEmpty().withMessage('类型type不能为空')
]

exports.upload = async (req, res) => {
  let type = req.body.type
  let dataType = req.body.dataType
  let dataListBuf = req.file.buffer
  let filename = req.file.originalname.toString()
  let size = req.file.size

  let uploadTime = new Date().getTime().toString()

  if (dataType === 'appeal') await uploadAppeal(req, res)
  else {
    /* 媒体ip */
    if (type === 'publisherIp') { // 媒体ip
      await blacklistService.submitPublishIPs(uploadTime, filename, size, dataListBuf)
      ok(res, '上传成功')
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

  if (!summary || summary.length === 0) return err(res, 'summary not exists')

  await blacklistService.submitAppeal(uploadTime, type, filename, size, dataListBuf, summary)
  ok(res, '上传成功')
}

async function uploadBlacklist (req, res) {
  let type = req.body.type
  let dataListBuf = req.file.buffer
  let filename = req.file.originalname.toString()
  let size = req.file.size

  let locked = await blacklistService.isLocked()
  logger.info(`lock status:${locked}`)

  if (locked) return err(res, '锁定期不能提交黑名单')

  await blacklistService.uploadBlacklist(filename, size, dataListBuf, type)
  ok(res, '上传成功')
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

exports.download = async (req, res) => {
  let path = req.query.path
  let name = req.query.name

  try {
    downloadIpfsFile(res, name, path)
  } catch (e) {
    logger.error(e)
    download(res, name, '下载出错')
  }
}

/**
 * 从job服务器下载ipfs并返回给客户端
 **/
function downloadIpfsFile (res, name, path) {
  res.attachment(name)

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
exports.downloadMergedlist = async (req, res) => {
  let type = req.query.type
  let filename = type + '-merged-' + new Date().getTime() + '.txt'

  try {
    // 查询最新的合并版本信息
    let mergedListIpfsInfo = await queryCC('getMergedList', [type])

    if (!mergedListIpfsInfo) return download(res, filename, '暂无数据')

    // 从ipfs上下载
    mergedListIpfsInfo = JSON.parse(mergedListIpfsInfo)
    downloadIpfsFile(res, filename, mergedListIpfsInfo.ipfsInfo.path)
  } catch (e) {
    logger.error(e)
    download(res, filename, '下载合并版本出错')
  }
}


/**
 *  版本信息
 **/
exports.versionInfo = async (req, res) => {
  // 获取最新生产版本信息
  let prodMergedList = await queryCC('getMergedHistoryList', ['device']) || '[]'

  prodMergedList = JSON.parse(prodMergedList).sort(descByTime) // 时间逆序

  let versionInfo = {}

  if (prodMergedList.length > 0) versionInfo.pubDate = new Date(parseInt(prodMergedList[0].timestamp))

  // 预测下个版本发布日期
  versionInfo.nextPubDate = nextPublishDate(versionInfo.pubDate)
  ok(res, '获取版本', versionInfo)
}

function nextPublishDate (date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 28)
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

  if (typesList.length === 0) return err(res, '未选择要下载的黑名单类型')

  if (env !== 'prod' && env !== 'dev') return err(res, '不支持的黑名单版本')

  let filesList

  if (env === 'prod') filesList = await prodMergeListForTypes(typesList)
  else if (env === 'dev') filesList = await devMergeListForTypes(typesList)

  if (filesList.length !== 0) {
    let versionInDate = filesList[0].fileName.replace('.log', '').split('-')[1]
    downloadZipfile(res, env + '-' + versionInDate + '.zip', filesList)
  } else return err(res, '该版本没有最新的黑名单')
}

/**
 * 预发布版本各类型合并文件列表
 **/
async function devMergeListForTypes (typesList) {
  let pathinfoList = []

  for (let type of typesList) {
    try {
      // 获取最新生产版本信息
      let mergedListInfo = await queryCC('getMergedList', [type]) || '{}'
      let ipfsinfo = JSON.parse(mergedListInfo).ipfsInfo

      if (ipfsinfo) {
        pathinfoList.push({
          fileName: type2Name(type) + '-' + versionFromName(ipfsinfo.name) + '.log',
          hash: ipfsinfo.hash
        })
      }
    } catch (e) {
      logger.error(e)
    }
  }

  return pathinfoList
}

function versionFromName (filename) {
  let timestamp = filename.replace('.log', '').split('-')[1]
  return versionFromTimestamp(timestamp, false)
}

function versionFromTimestamp (timestamp, adjustZone) {
  timestamp = parseInt(timestamp)

  if (adjustZone) timestamp += 1000 * 60 * 60 * 8

  let pubDate = new Date(timestamp)

  let month = pubDate.getMonth() + 1
  if (month < 10) month = '0' + month

  let day = pubDate.getDate()
  if (day < 10) day = '0' + day

  return pubDate.getFullYear() + '' + month + '' + day
}

/**
 * 生产版本各类型合并列表
 **/
async function prodMergeListForTypes (typesList) {
  let pathinfoList = []

  for (let type of typesList) {
    try {
      let historiesList = await queryCC('getMergedHistoryList', [type])

      if (!historiesList || historiesList.toLowerCase().indexOf('error') !== -1) continue

      historiesList = JSON.parse(historiesList).sort(descByTime) // 时间逆序

      // 最新的合并历史的ipfs信息
      let ipfsinfo = historiesList[0].ipfsInfo.ipfsInfo

      pathinfoList.push({
        fileName: type2Name(type) + '-' + versionFromTimestamp(historiesList[0].timestamp, true) + '.log',
        hash: ipfsinfo.hash
      })
    } catch (e) {
      logger.error(e)
    }
  }

  return pathinfoList
}

/*
* 将类型转换为中文名
* */
function type2Name (type) {
  switch (type) {
    case 'ip':
      return 'IP黑名单'

    case 'domain':
      return '域名黑名单'

    case 'ua_spider':
      return 'UA特征(机器及爬虫)'

    case 'ua_client':
      return 'UA特征(合格客户端)'

    case 'device':
      return '设备ID黑名单'

    case 'default':
      return '设备ID灰名单'

    case 'publisher_ip':
      return 'IP白名单'
  }
}

/**
 * 下载真实的ip
 **/
exports.downloadRealIPs = async (req, res) => {
  let resp = await agent.get(CONFIG__SITE.adminAddr + '/peer/downloadRealIPs').buffer()
  let realIPsInfo = JSON.parse(resp.text)

  if (!realIPsInfo.path) return download(res, `real-ips-${new Date().getTime()}.txt`, '暂无脱水ip')

  let realIPFileInfo = await ipfsCliRemote.get(realIPsInfo.path, realIPsInfo.name)
  download(res, realIPsInfo.name, realIPFileInfo.content.toString())
}

/**
 * 下载媒体ip接口
 **/
exports.validateDownloadPublishIPs = [
  check('mspId').not().isEmpty().withMessage('mspId不能为空')
]

exports.downloadPublishIPs = async (req, res) => {
  let mspId = req.query.mspId
  let filename = mspId + '-publisher-ips-' + new Date().getTime() + '.txt'

  try {
    let publisherIPsRecord = await queryCC('getPublisherIpByMspId', [mspId])

    if (!publisherIPsRecord) return download(res, filename, '暂无数据')

    publisherIPsRecord = JSON.parse(publisherIPsRecord)
    publisherIPsRecord.ipfsInfo = JSON.parse(publisherIPsRecord.ipfsInfo)
    downloadIpfsFile(res, filename, publisherIPsRecord.ipfsInfo.path)
  } catch (e) {
    logger.error(e)
    download(res, filename, '下载媒体IP出错')
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
 }
 ]
 **/

exports.histories = async (req, res, next) => {
  let dataType = req.body.dataType

  let startTimestamp = Date.parse(req.body.startDate) + ''
  let endTimestamp = Date.parse(req.body.endDate) + ''

  let memberName = req.body.memberName

  let pageNO = req.body.pageNO || 1

  let recordsList

  if (dataType === 'delta') {
    recordsList = await queryCC('listDeltaUploadHistory', [startTimestamp, endTimestamp]) || '[]'
  } else if (dataType === 'appeal') {
    recordsList = await queryCC('listAppeals', [startTimestamp, endTimestamp])
  } else {
    throw new Error('未知的数据类型:' + dataType)
  }

  if (recordsList.indexOf('Err') !== -1) return next(recordsList)

  recordsList = JSON.parse(recordsList).sort(descByTime) // 时间逆序

  // 查询指定成员
  if (memberName) recordsList = recordsList.filter(item => item.mspid.toLowerCase().indexOf(memberName.toLowerCase()) != -1)

  if (dataType === 'appeal') { // 申诉 --> 转化每一个key
    recordsList.forEach(appeal => {
      let details = appeal.details
      appeal.details.key = Buffer.from(details.key).toString('base64')

      // 检查自己是否已经投过票
      let selfMspid = CONFIG.msp.id

      if (details.agree.indexOf(selfMspid) !== -1 || details.against.indexOf(selfMspid) !== -1) appeal.selfVoted = true
    })
  }

  page(res, recordsList, pageNO)
}

/**
 * 查询合并版本历史
 result eg:
 [{"timestamp":"1536819883948","version":"2","ipfsInfo":{"version":2,"ipfsInfo":{"path":"QmYuNupvr9cBeSBo7sr1EgdthshSDFuXCM1Fw5oYDrgVoo","hash":"QmYuNupvr9cBeSBo7sr1EgdthshSDFuXCM1Fw5oYDrgVoo","size":260,"name":"device-merged-1536819877325.txt"}}}]
 **/
exports.validateMergedHistories = [
  check('type').not().isEmpty().withMessage('type不能为空')
]

exports.mergedHistories = async (req, res, next) => {
  let type = req.body.type

  let mergedList = await queryCC('getMergedHistoryList', [type])

  if (mergedList.indexOf('Err') !== -1) return next(mergedList)

  mergedList = JSON.parse(mergedList).sort(descByTime) // 时间逆序

  ok(res, '获取成功', mergedList)
}

/**
 * 获取媒体ip列表
 *
 **/
exports.validatePublisherIPs = [
  check('pageNO').not().isEmpty().withMessage('pageNO不能为空')
]

exports.publisherIPs = async (req, res, next) => {
  let pageNO = req.body.pageNO
  let memberName = req.body.memberName

  // 示例：[{"mspId":"RTBAsia","timestamp":"1535951671633","lines":2}]
  let publisherIps = await queryCC('getPublishers', [])

  if (publisherIps.indexOf('Err') !== -1) return next(publisherIps)

  publisherIps = JSON.parse(publisherIps).sort(descByTime) // 时间逆序

  // 查询指定成员
  if (memberName) {
    publisherIps = publisherIps.filter(item => {
      let mspId = item.mspid || item.mspId
      return mspId.toLowerCase().indexOf(memberName.toLowerCase()) != -1;
    })
  }

  publisherIps.forEach(record => record.ipfsInfo = JSON.parse(record.ipfsInfo))

  page(res, publisherIps, pageNO)
}

exports.mergeManually = async (req, res) => {
  if (CONFIG__SITE.dev) ok(res, await mergeCron.onTick())
}

/**
 * 给指定的申诉记录投票
 **/
exports.validateVoteAppeal = [
  check('key').not().isEmpty().withMessage('key不能为空'),
  check('action').not().isEmpty().withMessage('action不能为空')
]

exports.voteAppeal = async (req, res, next) => {
  let key = new Buffer(req.body.key, 'base64').toString()
  let action = req.body.action

  let result = await invokeCC('voteAppeal', [action, key])

  if (result && result.indexOf('Err') !== -1) return next(result)

  ok(res, '投票成功')
}

/**
 * 回调接口
 **/
exports.callback = async (req, res) => {
  let cmd = req.body.cmd
  let args = req.body.args

  if (!blacklistService[cmd]) return ok(res)

  let result = await blacklistService[cmd](args, req.body)

  if (result) {
    ok(res, `success to call ${cmd}(${JSON.stringify(args)})`)
    logger.info(`success to call  ${cmd}(${JSON.stringify(args)})`)
  } else {
    err(res, `error to call  ${cmd}(${JSON.stringify(args)})`)
    logger.info(`error to call  ${cmd}(${JSON.stringify(args)})`)
  }
}

/**
 * 任务历史接口
 **/
exports.jobs = async (req, res) => {
  let start = req.body.start || 0
  let end = req.body.end || 10

  let jobsResults = await agent
    .get(`${MERGE_SERVICE_URL}/jobs?start=${start}&end=${end}`)
    .buffer()

  ok(res, undefined, JSON.parse(jobsResults.text))
}

/**
 * 锁定接口
 **/
exports.isLocked = async (req, res) => {
  const locked = await blacklistService.isLocked()
  ok(res, '查询成功', {locked})
}
