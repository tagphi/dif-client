/* eslint-disable node/no-deprecated-api,no-trailing-spaces,space-before-function-paren */

let queryCC = require('../cc/query')
let invokeCC = require('../cc/invoke')
var CONFIG = require('../../config.json')
var CONFIG_IPFS = require('../../config.json').site.ipfs
var agent = require('superagent-promise')(require('superagent'), Promise)
let ADMIN_ADDR = CONFIG.site.adminAddr
let logger = require('../utils/logger-utils').logger()

let ipfsCliLocal = require('../utils/ipfs-cli')
let ipfsCliRemote = require('../utils/ipfs-cli-remote').bind(CONFIG_IPFS.host, CONFIG_IPFS.port)
var BloomFilter = require('bloomfilter').BloomFilter

/**
 * 上传申诉
 **/
async function uploadAppeal (filename, newAppealList, type, dataType, summary) {
  logger.info(`start to upload ${type} appeal list:${filename},timestamp:${new Date().getTime()}`)
  let appealFileIpfsinfo = await _uploadToIpfs(filename, type, newAppealList)
  // 保存到账本
  await invokeCC('createAppeal', [appealFileIpfsinfo, type, summary, new Date().getTime().toString()])
  logger.info(`[${type}] success to upload appeal list:${appealFileIpfsinfo}`)
}

/**
 * 上传媒体ip
 **/
async function uploadPublisherIP (type, newPublisherIps) {
  await invokeCC('uploadPublisherIp', [newPublisherIps, new Date().getTime().toString()])
  logger.info(`[${type}] success to upload publisher ip list ${new Date().getTime()}`)
}

/**
 * 上传黑名单
 **/
async function uploadBlacklist (filename, newBlacklist, type) {
  let startTime = new Date().getTime()
  logger.info(`start to upload ${type} blacklist:${filename},timestamp:${startTime}`)

  // 链码查询该组织该类型的列表的全量数据的路径
  logger.info(`[${type}]:start to download full list`)
  let fulllistIpfsInfo = await queryCC('getOrgList', [type])

  submitBlacklistToJobHistory(filename, newBlacklist, type, fulllistIpfsInfo)
}

/**
 * TODO:提交给java任务服务器
 **/
function submitBlacklistToJobHistory (filename, newBlacklist, type, fulllistIpfsInfo) {

}

/**
 * 确认提交黑名单
 **/
async function commitBlacklist (filename, newBlacklist, type, newBlacklistIpfs, mergedBlacklistIpfs) {
  await invokeCC('deltaUpload', [newBlacklistIpfs, type, new Date().getTime().toString()])
  logger.info(`success to upload ${type} blacklist:${filename}`)

  await invokeCC('fullUpload', [mergedBlacklistIpfs, type])
  logger.info(`success to upload ${type} fulllist`)

  logger.info(`end to upload ${type} blacklist:${filename}`)
}

async function merge (type, latestVersion) {
  // 获取共识的移除清单
  let startTime = new Date().getTime()
  logger.info(`[${type}]:start to download consused rm list of all orgs`)
  let rmSetOfConsensus = await _getConsensusedRmList(type)
  let endTime = new Date().getTime()
  logger.info(`[${type}]:end to download consused rm list of all orgs:${endTime - startTime}ms`)

  logger.info(`[${type}]:start to download full list`)
  // 获取合并的全量列表
  let mergedFullList = await _getMergedFullListOfOrgs(type)
  let endTimeOfDownFull = new Date().getTime()
  logger.info(`[${type}]:end to download full list:${endTimeOfDownFull - endTime}ms`)

  // 剔除媒体ip
  if (type === 'ip') {
    logger.info(`[${type}]:start to filter ips of publishers`)
    mergedFullList = await filterPublisherIps(mergedFullList)
    let endOfFilter = new Date().getTime()
    logger.info(`[${type}]:end to filter ips of publishers:${endOfFilter - endTimeOfDownFull}ms`)
  }

  // 剔除不符合的记录
  logger.info(`[${type}]:start to consenus`)
  let startTimeOfConsensus = new Date().getTime()
  let finnalResult = _getFinnalRecords(mergedFullList, rmSetOfConsensus, type)
  mergedFullList = finnalResult.tmpMergedFullList
  let bloomFilter = finnalResult.bloomFilter
  let endOfConsensus = new Date().getTime()
  logger.info(`[${type}]:end to consenus:${endOfConsensus - startTimeOfConsensus}ms`)
  // 将投票集合转换为列表
  let formattedMergedStr = _formatMergedList(mergedFullList)

  /* 上传最终的合并列表 */
  // 1 上传到ipfs
  let lenOfformattedMergedStr = strLenInHuman(formattedMergedStr)
  logger.info(`[${type}]:start to upload merged list to ipfs:${lenOfformattedMergedStr}`)
  startTime = new Date().getTime()
  let ipfsInfo = await ipfsCliRemote.addByStr(formattedMergedStr, {
    progress: function (uploadedSize) {
      uploadedSize = Math.floor(uploadedSize / (1024 * 1024))
      logger.info(`[${type}]:progress of uploading to ipfs:${uploadedSize}`)
    }
  })
  endTime = new Date().getTime()
  logger.info(`[${type}]:end to upload merged list to ipfs:${endTime - startTime}ms`)
  ipfsInfo.name = type + '-merged-' + new Date().getTime() + '.txt'

  // 2 上传到账本
  if (!latestVersion) {
    let version = await queryCC('version', [])
    latestVersion = parseInt(version)
  }

  ipfsInfo = JSON.stringify(ipfsInfo)
  if (type === 'ip') {
    let bloomBuckets = JSON.stringify([].slice.call(bloomFilter.buckets))
    await invokeCC('uploadMergeList', [ipfsInfo, type, latestVersion + '', bloomBuckets])
  } else {
    await invokeCC('uploadMergeList', [ipfsInfo, type, latestVersion + ''])
  }

  // 链码中投票合并
  await invokeCC('merge', [type, new Date().getTime().toString()])
  logger.info(`[${type}] new merge list:${ipfsInfo}`)
}

async function getMergedRmList (type) {
  // 从链码获取hash列表
  let rmListOfOrgs = await queryCC('getRemoveList', [type])

  logger.info(`[${type}] current orgs remove list:${rmListOfOrgs}`)

  // 下载全部申诉列表数据
  let rmListFileInfosOfOrgs = await _downloadDataFromIPFS(rmListOfOrgs)

  // 合并所有组织的申诉列表的投票
  let mergedRmList = _groupVoterByRecord(rmListFileInfosOfOrgs)

  return mergedRmList
}

/**
 * 上传数据到ipfs
 **/
async function _uploadToIpfs (filename, type, dataList) {
  let lenOfdata = strLenInHuman(dataList)
  let startTime = new Date().getTime()
  logger.info(`start to upload ${type} to ipfs:${filename}(${lenOfdata}),timestamp:${startTime}`)

  let uploadedIpfsinfo = await ipfsCliRemote.addByStr(dataList, {
    progress: function (uploadedSize) {
      uploadedSize = Math.floor(uploadedSize / (1024 * 1024))
      logger.info(`progress of uploading ${type}-${filename} to ipfs:${uploadedSize}`)
    }
  })
  uploadedIpfsinfo.name = filename
  uploadedIpfsinfo = JSON.stringify(uploadedIpfsinfo)

  let endTime = new Date().getTime()
  logger.info(`end to upload ${type}-${filename} to ipfs:timestamp:${endTime - startTime}`)
  return uploadedIpfsinfo
}

/**
 * 获取共识的移除清单
 **/
async function _getConsensusedRmList (type) {
  let mergedRmList = await getMergedRmList(type)

  // 获取共识标准
  let minRmVotesOfConsensus = await _getQuorum()

  let rmSetOfConsensus = new Set()

  for (let record in mergedRmList) {
    let recordVotes = mergedRmList[record].size

    if (recordVotes >= minRmVotesOfConsensus) {
      rmSetOfConsensus.add(record)
    }
  }

  return rmSetOfConsensus
}

/**
 * 申诉列表共识所需最小票数为所有成员数的1/3
 */
async function _getQuorum () {
  let resp = await agent.post(ADMIN_ADDR + '/peer/peers2').buffer()
  let peers = JSON.parse(resp.text)
  let limit = Math.ceil(peers.length / 3)

  return limit
}

/**
 * 获取合并的全量列表
 **/
async function _getMergedFullListOfOrgs (type) {
  let fullListOfArgs = await queryCC('getAllOrgsList', [type])

  logger.info(`[${type}] current orgs full list:${fullListOfArgs}`)
  // 下载全量列表
  let fullListFileInfos = await _downloadDataFromIPFS(fullListOfArgs)

  // 合并所有组织的记录的投票
  let mergedFullList = _groupVoterByRecord(fullListFileInfos)
  return mergedFullList
}

/**
 * 下载数据文件
 **/
async function _downloadDataFromIPFS (listOfOrgs) {
  if (!listOfOrgs || listOfOrgs === '') return []
  listOfOrgs = JSON.parse(listOfOrgs)

  let msgIDsOfOrgs = []
  let listPathsOfOrgs = []

  let sizeOfAllList = 0
  listOfOrgs.forEach(function (oneOrg) {
    let mspid = oneOrg.mspId || oneOrg.mspid
    msgIDsOfOrgs.push(mspid)
    let ipfsInfo
    if (typeof oneOrg.ipfsInfo === 'string') {
      ipfsInfo = JSON.parse(oneOrg.ipfsInfo)
    } else {
      ipfsInfo = oneOrg.ipfsInfo
    }
    let sizeOfOne = ipfsInfo.size || 0
    sizeOfAllList += sizeOfOne
    listPathsOfOrgs.push(ipfsInfo.path)
  })
  let sizeOfAllListInHuman = sizeInHuman(sizeOfAllList)
  logger.info(`size to download:${sizeOfAllListInHuman}`)
  // 下载全部列表数据
  let listFileInfosOfOrgs = await ipfsCliLocal.getMulti(listPathsOfOrgs, msgIDsOfOrgs)

  // 剔除所有超时而无数据的文件
  listFileInfosOfOrgs = listFileInfosOfOrgs.filter(fileInfo => {
    return !fileInfo.err
  })

  return listFileInfosOfOrgs
}

/**
 *  计算每个记录的组织投票
 **/
function _groupVoterByRecord (listFileInfos) {
  let votedList = {}

  listFileInfos.forEach(function (listFileInfo) {
    let orgId = listFileInfo.id
    let listRecords = listFileInfo.content.toString()

    if (listRecords.indexOf('[') !== -1) { // json数组字符串
      listRecords = JSON.parse(listRecords)
    } else {
      listRecords = listRecords.split('\n')
    }

    listRecords.forEach(function (record) {
      if (!votedList[record]) votedList[record] = new Set()
      votedList[record].add(orgId)
    })
  })

  return votedList
}

/**
 *  提出没达到票数的记录，和存在于申诉列表中的记录
 **/
function _getFinnalRecords (mergedFullList, rmSetOfConsensus, type) {
  let tmpMergedFullList = {}
  var bloomFilter = new BloomFilter(
    8 * 256, // number of bits to allocate.
    16 // number of hash functions.
  )
  for (let record in mergedFullList) {
    if (rmSetOfConsensus.has(record)) continue

    // 剔除未达到指定票数的记录
    if (type === 'ip' || type === 'default') { // 必须2个以上投票
      let votes = mergedFullList[record].size

      if (votes < 2) {
        continue
      }
    }

    // 生成ip的布隆过滤器
    if (type === 'ip') {
      bloomFilter.add(record)
    }

    tmpMergedFullList[record] = mergedFullList[record]
  }

  return {tmpMergedFullList, bloomFilter}
}

/**
 * 过滤掉媒体ip
 **/
async function filterPublisherIps(mergedIps) {
  // eg:"["127.0.0.1\n127.0.0.2",]"
  let publisterIps = await queryCC('getPublisherIp', [])
  if (!publisterIps) return mergedIps

  let ips = Object.keys(mergedIps)
  ips.forEach(function (ip) {
    if (publisterIps.indexOf(ip) !== -1) { // 为媒体ip
      delete mergedIps[ip]
    }
  })
  return mergedIps
}

/**
 * 将投票集合转换为列表
 **/
function _formatMergedList (mergedFullList) {
  let formattedStr = ''

  // 记录排序
  let records = Object.keys(mergedFullList)
  records.sort()
  let len = records.length

  for (let i = 0; i < len; i++) {
    let record = records[i]

    let votesSet = mergedFullList[record]

    // 投票排序
    let votes = Array.from(votesSet).sort().join(',')

    formattedStr += record + ':' + votes

    if (i !== len - 1) { // 换行
      formattedStr += '\n'
    }
  }

  return formattedStr
}

/**
 * 计算字符串大小
 **/
function strLenInHuman(str) {
  str = str || ''
  let len = str.length
  return sizeInHuman(len)
}

/**
 * size转换为友好单位
 **/
function sizeInHuman(len) {
  let UNIT_KB = 1024
  let lenInMB = len / (UNIT_KB * UNIT_KB)
  if (lenInMB >= 1) return Math.floor(lenInMB) + 'MB'
  let lenInKB = len / (UNIT_KB)
  if (lenInKB >= 1) return Math.floor(lenInKB) + 'KB'
  return len + 'B'
}

exports.uploadAppeal = uploadAppeal
exports.uploadPublisherIP = uploadPublisherIP

exports.uploadBlacklist = uploadBlacklist
exports.commitBlacklist = commitBlacklist

exports.merge = merge
exports.getMergedRmList = getMergedRmList
