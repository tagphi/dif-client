/* eslint-disable node/no-deprecated-api,no-trailing-spaces,space-before-function-paren */

let queryCC = require('../cc/query')
let invokeCC = require('../cc/invoke')
let CONFIG = require('../../config.json')
var MERGE_SERVICE_URL = CONFIG.site.mergeServiceUrl
var callbackUrl = CONFIG.site.callbackUrl
let logger = require('../utils/logger-utils').logger()

let ipfsCliLocal = require('../utils/ipfs-cli')
var superagent = require('superagent-promise')(require('superagent'), Promise)

/**
 * 提交申诉给java任务服务器
 **/
async function submitAppeal (uploadTime, type, filename, size, appealsBuf, summary) {
  let resp = await submitToJobHistory('/appeal', type, appealsBuf,
    undefined,
    {cmd: 'commitAppeal', args: {type, filename, uploadTime, size, summary}})

  logger.info(`submit appeal to job history:type-${type},filename:${filename},resp:${resp}`)
  return resp
}

/**
 * 确认提交申诉列表
 **/
async function commitAppeal (callbackArgs, argsFromJobHist) {
  let appealFileIpfsinfo = makeIpfsinfo(callbackArgs.filename, argsFromJobHist.hash, callbackArgs.size)
  await invokeCC('createAppeal', [appealFileIpfsinfo, callbackArgs.type, callbackArgs.summary, callbackArgs.uploadTime])
  logger.info(`success to upload ${callbackArgs.type} appeal:${callbackArgs.filename}`)
  return true
}

/**
 * 提交媒体ip给java任务服务器
 **/
async function submitPublishIPs (uploadTime, filename, size, publishIpsBuf) {
  let recordsCount = publishIpsBuf.toString().split('\n').length
  let resp = await submitToJobHistory('/publisherIp', 'publisher-ip', publishIpsBuf,
    undefined,
    {cmd: 'commitPublisherIPs', args: {filename, uploadTime, size, lines: recordsCount}})

  logger.info(`submit publisherips to job history:filename:${filename},resp:${resp}`)
  return resp
}

/**
 * 确认提交申诉列表
 **/
async function commitPublisherIPs (callbackArgs, argsFromJobHist) {
  let publisherIpsFileIpfsinfo = makeIpfsinfo(callbackArgs.filename, argsFromJobHist.hash, callbackArgs.size)
  publisherIpsFileIpfsinfo = JSON.parse(publisherIpsFileIpfsinfo)
  publisherIpsFileIpfsinfo.lines = callbackArgs.lines
  publisherIpsFileIpfsinfo = JSON.stringify(publisherIpsFileIpfsinfo)
  await invokeCC('uploadPublisherIp', [publisherIpsFileIpfsinfo, callbackArgs.uploadTime])

  logger.info(`success to upload ${callbackArgs.type} publisher ips:${callbackArgs.filename}`)
  return true
}

/**
 * 上传黑名单
 **/
async function uploadBlacklist (filename, size, blacklistBuf, type) {
  let uploadTime = new Date().getTime().toString()
  logger.info(`start to upload ${type} blacklist:${filename}`)

  // 链码查询该组织该类型的列表的全量数据的路径 QmfLr6D4MKd1ZXaZC12TGcxf4oXLWcFzFQ7YEAiRDh7fvz
  let fullBlacklistIpfsInfo = await queryCC('getOrgList', [type]) || '{}'
  fullBlacklistIpfsInfo = JSON.parse(fullBlacklistIpfsInfo)

  // 提交给java任务服务器
  submitBlacklistToJobHistory(uploadTime, type, filename, size, blacklistBuf, fullBlacklistIpfsInfo.path)

  logger.info(`success to upload ${type} blacklist:${filename}`)
}

/**
 * 提交黑名单给java任务服务器
 **/
async function submitBlacklistToJobHistory (uploadTime, type, filename, size, blacklistBuf, fullBlacklistIpfsInfo) {
  let resp = await submitToJobHistory('/deltaUpload', type, blacklistBuf,
    {oldHash: fullBlacklistIpfsInfo},
    {cmd: 'commitBlacklist', args: {type, filename, uploadTime, size}})

  logger.info(`submit blacklist to job history:type-${type},filename:${filename},resp:${resp}`)
  return resp
}

/**
 * 提交任务给job服务器
 **/
async function submitToJobHistory (jobApi, type, dataBuf, extraArgs, callbackArgs) {
  let resp = await superagent
    .post(`${MERGE_SERVICE_URL}${jobApi}`)
    .attach('file', dataBuf, 'file')
    .field('type', type)
    .field('extraArgs', extraArgs ? JSON.stringify(extraArgs) : '{}')
    .field('callbackUrl', callbackUrl)
    .field('callbackArgs', callbackArgs ? JSON.stringify(callbackArgs) : '{}')
    .buffer()
  resp = resp.text
  let respJson = JSON.parse(resp)

  if (respJson.statusCode === 'BAD_REQUEST') {
    logger.error(`error to submit to job history:type-${type},filename:,resp:${resp}`)
    throw new Error(resp)
  } else {
    return resp
  }
}

/**
 * 确认提交黑名单
 **/
async function commitBlacklist (callbackArgs, argsFromJobHist) {
  let deltaIpfsInfo = makeIpfsinfo(callbackArgs.filename, argsFromJobHist.deltaHash, callbackArgs.size)
  await invokeCC('deltaUpload', [deltaIpfsInfo, callbackArgs.type, callbackArgs.uploadTime])
  logger.info(`success to upload ${callbackArgs.type} blacklist:${callbackArgs.filename}`)

  let fullIpfsInfo = makeIpfsinfo(callbackArgs.filename, argsFromJobHist.fullHash, -1)
  await invokeCC('fullUpload', [fullIpfsInfo, callbackArgs.type])
  logger.info(`success to upload ${callbackArgs.type} fulllist`)
  return true
}

async function merge (type, latestVersion) {
  // 查询所有组织的移除列表信息
  let allRmListInfo = await queryCC('getRemoveList', [type]) | '[]'
  allRmListInfo = allRmListInfo === 0 ? '[]' : allRmListInfo
  allRmListInfo = extractPaths(allRmListInfo)

  // 剔除媒体ip
  let publishIpfsInfo = ''
  if (type === 'ip') {
    publishIpfsInfo = await queryCC('getPublisherIp', []) || '[]'
    publishIpfsInfo = extractPaths(publishIpfsInfo)
    allRmListInfo = allRmListInfo.concat(publishIpfsInfo)
  }

  // 获取合并的全量列表
  let allOrgsFulllists = await queryCC('getAllOrgsList', [type]) || '[]'
  allOrgsFulllists = concatHashAndMspid(allOrgsFulllists)

  submitToJobHistory('/merge', type, undefined,
    {blacklist: allOrgsFulllists, removelist: allRmListInfo},
    {cmd: 'commitMerge', args: {type, latestVersion}})
}

/**
 * 拼接组织mspid和文件路径hash
 **/
function concatHashAndMspid (ipfsinfosListStr) {
  let ipfsinfosList = JSON.parse(ipfsinfosListStr)
  return ipfsinfosList.map(ipfsinfo => `${ipfsinfo.mspId}:${ipfsinfo.ipfsInfo.hash}`)
}

/**
 * 提取path
 **/
function extractPaths (records) {
  records = JSON.parse(records)

  return records.map(function (rec) {
    if (typeof rec.ipfsInfo === 'string') {
      return JSON.parse(rec.ipfsInfo).hash
    }
    return rec.ipfsInfo.hash
  })
}

/**
 * 确认提交合并
 **/
async function commitMerge (callbackArgs, argsFromJobHist) {
  let now = new Date().getTime().toString()
  let mergedListIpfsinfo = makeIpfsinfo(`${callbackArgs.type}-${now}.log`, argsFromJobHist.hash, -1)

  await invokeCC('uploadMergeList', [mergedListIpfsinfo, callbackArgs.type, callbackArgs.latestVersion + ''])
  // 链码中投票合并
  await invokeCC('merge', [callbackArgs.type, now])

  logger.info(`[${callbackArgs.type}]:success to generate merge list:${callbackArgs.latestMergeIpfsInfo}`)
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
 * size转换为友好单位
 **/
function sizeInHuman (len) {
  let UNIT_KB = 1024
  let lenInMB = len / (UNIT_KB * UNIT_KB)
  if (lenInMB >= 1) return Math.floor(lenInMB) + 'MB'
  let lenInKB = len / (UNIT_KB)
  if (lenInKB >= 1) return Math.floor(lenInKB) + 'KB'
  return len + 'B'
}

/**
 * 构建ipfsinfo
 **/
function makeIpfsinfo (filename, hash, size) {
  let deltaIpfsInfo = {}
  deltaIpfsInfo.hash = hash
  deltaIpfsInfo.path = hash
  deltaIpfsInfo.name = filename
  deltaIpfsInfo.size = size

  return JSON.stringify(deltaIpfsInfo)
}

exports.submitAppeal = submitAppeal
exports.commitAppeal = commitAppeal

exports.submitPublishIPs = submitPublishIPs
exports.commitPublisherIPs = commitPublisherIPs

exports.uploadBlacklist = uploadBlacklist
exports.commitBlacklist = commitBlacklist

exports.merge = merge
exports.commitMerge = commitMerge
exports.getMergedRmList = getMergedRmList
