/* eslint-disable node/no-deprecated-api,no-trailing-spaces,space-before-function-paren */

let queryCC = require('../cc/query')
let invokeCC = require('../cc/invoke')
var CONFIG_IPFS = require('../../config.json').site.ipfs
let logger = require('../utils/logger-utils').logger()

let ipfsCliLocal = require('../utils/ipfs-cli')
let ipfsCliRemote = require('../utils/ipfs-cli-remote').bind(CONFIG_IPFS.host, CONFIG_IPFS.port)

/**
 * 上传申诉
 **/
async function uploadAppeal (filename, newAppealList, type, dataType, summary) {
  logger.info(`start to upload ${type} appeal list:${filename}`)

  let appealFileIpfsinfo = await _uploadToIpfs(filename, type, newAppealList)
  // 保存到账本
  await invokeCC('createAppeal', [appealFileIpfsinfo, type, summary, new Date().getTime().toString()])

  logger.info(`[${type}] success to upload appeal list:${appealFileIpfsinfo}`)
}

/**
 * 上传媒体ip
 **/
async function uploadPublisherIP (type, publisherIps) {
  // TODO:提交到历史服务器

  logger.info(`[${type}] submit job:upload publisher ip list`)
}

/**
 * 确认提交媒体ip
 **/
async function commitPublisherIPs (publisherIpsInfo) {
  await invokeCC('uploadPublisherIp', [publisherIpsInfo, new Date().getTime().toString()])

  logger.info(`commit job:upload publisher ip list:${publisherIpsInfo}`)
  return true
}

/**
 * 上传黑名单
 **/
async function uploadBlacklist (filename, newBlacklist, type) {
  logger.info(`start to upload ${type} blacklist:${filename}`)

  // 链码查询该组织该类型的列表的全量数据的路径
  let fullBlacklistIpfsInfo = await queryCC('getOrgList', [type])

  // 提交给java任务服务器
  submitBlacklistToJobHistory(type, filename, newBlacklist, fullBlacklistIpfsInfo)

  logger.info(`success to upload ${type} blacklist:${filename}`)
}

/**
 * TODO:提交给java任务服务器
 **/
function submitBlacklistToJobHistory (type, filename, newBlacklist, fullBlacklistIpfsInfo) {

}

/**
 * 确认提交黑名单
 **/
async function commitBlacklist (type, filename, newBlacklistIpfsInfo, mergedBlacklistIpfsInfo) {
  await invokeCC('deltaUpload', [newBlacklistIpfsInfo, type, new Date().getTime().toString()])
  logger.info(`success to upload ${type} blacklist:${filename}`)

  await invokeCC('fullUpload', [mergedBlacklistIpfsInfo, type])
  logger.info(`success to upload ${type} fulllist`)
  return true
}

async function merge (type, latestVersion) {
  // 查询所有组织的移除列表信息
  let allRmListInfo = await queryCC('getRemoveList', [type])

  // 获取合并的全量列表
  let allOrgsFulllists = await queryCC('getAllOrgsList', [type])

  // 提交合并任务
  submitMergeToJobHistory(type, latestVersion, allRmListInfo, allOrgsFulllists)
}

/**
 * // TODO:提交合并任务
 **/
async function submitMergeToJobHistory (type, latestVersion, allRmListInfo, allOrgsFulllists) {
  // 剔除媒体ip
  let publishIps = ''
  if (type === 'ip') {
    publishIps = await queryCC('getPublisherIp', [])
  }
  console.log('————>', publishIps)
}

/**
 * 确认提交合并
 **/
async function commitMerge (type, latestVersion, latestMergeIpfsInfo, bloomBuckets) {
  if (type === 'ip') {
    await invokeCC('uploadMergeList', [latestMergeIpfsInfo, type, latestVersion + '', bloomBuckets])
  } else {
    await invokeCC('uploadMergeList', [latestMergeIpfsInfo, type, latestVersion + ''])
  }

  // 链码中投票合并
  await invokeCC('merge', [type, new Date().getTime().toString()])

  logger.info(`[${type}]:success to generate merge list:${latestMergeIpfsInfo}`)
  return true
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
  logger.info(`start to upload ${type} to ipfs:${filename}(${lenOfdata})`)

  let uploadedIpfsinfo = await ipfsCliRemote.addByStr(dataList, {
    progress: function (uploadedSize) {
      uploadedSize = Math.floor(uploadedSize / (1024 * 1024))
      logger.info(`progress of uploading ${type}-${filename} to ipfs:${uploadedSize}`)
    }
  })
  uploadedIpfsinfo.name = filename
  uploadedIpfsinfo = JSON.stringify(uploadedIpfsinfo)

  let endTime = new Date().getTime()
  logger.info(`end to upload ${type}-${filename} to ipfs,consuming:${endTime - startTime} ms`)
  return uploadedIpfsinfo
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
exports.commitPublisherIPs = commitPublisherIPs

exports.uploadBlacklist = uploadBlacklist
exports.commitBlacklist = commitBlacklist

exports.merge = merge
exports.commitMerge = commitMerge
exports.getMergedRmList = getMergedRmList
exports.cbtest = function (args) {
  console.log('cbtest————>', args)
  return true
}
