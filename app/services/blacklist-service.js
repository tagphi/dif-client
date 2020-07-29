/* eslint-disable node/no-deprecated-api,no-trailing-spaces,space-before-function-paren */

let queryCC = require('../cc/query')
let invokeCC = require('../cc/invoke')

let CONFIG = require('../../config.json')
var MERGE_SERVICE_URL = CONFIG.site.mergeServiceUrl
var callbackUrl = CONFIG.site.callbackUrl

let logger = require('../utils/logger-utils').logger()

var superagent = require('superagent-promise')(require('superagent'), Promise)

/**
 * 提交申诉给java任务服务器
 **/
async function submitAppeal (uploadTime, type, filename, size, appealsBuf, summary) {
  let resp = await submitToJobHistory('/appeal', type, appealsBuf, undefined,
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
  let resp = await submitToJobHistory('/publisherIp', 'publisher-ip', publishIpsBuf, undefined,
    {cmd: 'commitPublisherIPs', args: {filename, uploadTime, size, lines: recordsCount}})

  logger.info(`submit publisherips to job history:filename:${filename},resp:${resp}`)
  return resp
}

/**
 * 确认提交申诉列表
 **/
async function commitPublisherIPs (callbackArgs, argsFromJobHist) {
  let info = JSON.parse(makeIpfsinfo(callbackArgs.filename, argsFromJobHist.hash, callbackArgs.size))
  info.lines = callbackArgs.lines
  info = JSON.stringify(info)

  await invokeCC('uploadPublisherIp', [info, callbackArgs.uploadTime])
  logger.info(`success to upload ${callbackArgs.type} publisher ips:${info}`)
  return true
}

async function commitUA (resp, filename, size, type, uploadTime) {
  // 提交增量
  let delta = makeIpfsinfo(filename, resp.sampleFileHash, size)
  await invokeCC('deltaUpload', [delta, type, uploadTime])
  logger.info(`success to upload ${type} blacklist:${filename}`)

  // 提交全量
  let full = makeIpfsinfo(filename, resp.patternHash, -1)
  await invokeCC('fullUpload', [full, type])
  logger.info(`success to upload ${type} fulllist`)
}

/**
 * 上传黑名单
 **/
async function uploadBlacklist (filename, size, blacklistBuf, type) {
  let uploadTime = new Date().getTime().toString()
  logger.info(`start to upload ${type} blacklist:${filename}`)

  // 链码查询该组织该类型的列表的全量数据的路径 QmfLr6D4MKd1ZXaZC12TGcxf4oXLWcFzFQ7YEAiRDh7fvz
  let fullListInfo = await queryCC('getOrgList', [type]) || '{}'
  fullListInfo = JSON.parse(fullListInfo)

  // 提交给java任务服务器
  logger.info(`success to upload ${type} blacklist:${filename}`)

  if (type.indexOf('ua') !== -1) { // ua同步返回delta ipfs 和full ipfs
    let resp = await submitUAToJobHistory(uploadTime, type, filename, size, blacklistBuf, fullListInfo.path)
    await commitUA(resp, filename, size, type, uploadTime)
  } else await submitDeltaToJobHistory(uploadTime, type, filename, size, blacklistBuf, fullListInfo.path)
}

/**
 * 提交增量黑名单给java任务服务器
 **/
async function submitDeltaToJobHistory (uploadTime, type, filename, size, blacklistBuf, fullBlacklistIpfsInfo) {
  let resp = await submitToJobHistory('/deltaUpload', type, blacklistBuf,
    {oldHash: fullBlacklistIpfsInfo},
    {cmd: 'commitBlacklist', args: {type, filename, uploadTime, size}})

  logger.info(`submit blacklist to job history:type-${type},filename:${filename},resp:${resp}`)
  return resp
}

/**
 * 提交UA黑名单给java任务服务器
 **/
async function submitUAToJobHistory (uploadTime, type, filename, size, blacklistBuf, fullBlacklistIpfsInfo) {
  let resp = await submitToJobHistory('/uaUpload', type, blacklistBuf,
    {oldHash: fullBlacklistIpfsInfo},
    {cmd: 'commitBlacklist', args: {type, filename, uploadTime, size}})

  logger.info(`submit blacklist to job history:type-${type},filename:${filename},resp:${resp}`)
  return JSON.parse(resp)
}

/**
 * 提交任务给job服务器
 **/
async function submitToJobHistory (jobApi, type, dataBuf, extraArgs = {}, callbackArgs = {}, version) {
  logger.info(`jobApi=${jobApi}, \n type=${type}, \n extraArgs=${JSON.stringify(extraArgs).substr(0, 100)}, \n callbackArgs=${JSON.stringify(callbackArgs).substr(0, 100)},\n version:${version}`)

  let resp = await superagent
    .post(`${MERGE_SERVICE_URL}${jobApi}`)
    .attach('file', dataBuf, 'file')
    .field('type', type === 'default' ? 'DEFAULTDEVICE' : type.toUpperCase())
    .field('version', version || 0)
    .field('extraArgs', extraArgs ? JSON.stringify(extraArgs) : '{}')
    .field('callbackUrl', callbackUrl)
    .field('callbackArgs', callbackArgs ? JSON.stringify(callbackArgs) : '{}')
    .buffer()

  logger.info(`submit resp:${MERGE_SERVICE_URL}${jobApi} \n ${JSON.stringify(resp)}`)
  resp = resp.text
  let respJson = JSON.parse(resp)

  if (respJson.statusCode === 'BAD_REQUEST') {
    logger.error(`error to submit to job history:type-${type},filename:,resp:${resp}`)
    throw new Error(`格式错误：${respJson.message}`)
  } else return resp
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

/*
* 所有组织指定类型的全量列表
*
* @returns ['mspid:hash']
* */
async function fulllistOfOrgs (type) {
  let orgsFulllists = await queryCC('getAllOrgsList', [type]) || '[]'
  return concatHashAndMspid(orgsFulllists);
}

async function merge (type, latestVersion) {
  // 获取合并的全量列表 格式：['mspid:hash']
  let orgsFulllists = await fulllistOfOrgs(type);

  // 合并ua（合规客户端或爬虫）
  if (type.indexOf('ua') !== -1) return await mergeUA(orgsFulllists, latestVersion, type)

  let extraArgs = {
    blacklist: orgsFulllists
  }

  // 查询所有组织的移除列表信息
  let allRmList = await queryCC('getRemoveList', [type]) || '[]'
  allRmList = extractPaths(allRmList)

  // 剔除媒体ip
  let publisherIPs = ''

  if (type === 'ip') {
    publisherIPs = await queryCC('getPublisherIp', []) || '[]'
    publisherIPs = extractPaths(publisherIPs)

    allRmList = allRmList.concat(publisherIPs)
  }

  extraArgs.removelist = allRmList

  // 合并设备id的话，需要剔除掉对应的白名单（默认设备）
  if (type === 'device') {
    let defaultMergedList = await queryCC('getMergedList', ['default'])
    if (defaultMergedList) extraArgs.greylist = [JSON.parse(defaultMergedList).ipfsInfo.path]
  }

  await submitToJobHistory('/merge', type, undefined, extraArgs,
    {cmd: 'commitMerge', args: {type, latestVersion}}, latestVersion)
}

async function mergeUA (fulllistOfOrgs, latestVersion, type) {
  await submitToJobHistory('/merge', type === 'ua_spider' ? 'UASpider' : 'UAClient', undefined,
    {blacklist: fulllistOfOrgs},
    {cmd: 'commitMerge', args: {type, latestVersion}}, latestVersion)
}

/**
 * 拼接组织mspid和文件路径hash
 **/
function concatHashAndMspid (ipfsinfosListStr) {
  return JSON.parse(ipfsinfosListStr)
    .map(ipfsinfo => `${ipfsinfo.mspId}:${ipfsinfo.ipfsInfo.hash}`)
}

/**
 * 提取path
 **/
function extractPaths (records) {
  return JSON.parse(records)
    .map(rec => typeof rec.ipfsInfo === 'string' ? JSON.parse(rec.ipfsInfo).hash : rec.ipfsInfo.hash)
}

/**
 * 确认提交合并
 **/
async function commitMerge (callbackArgs, argsFromJobHist) {
  let type = callbackArgs.type;

  let mergedListIpfsinfo = makeIpfsinfo(`${type}-${new Date().getTime()}.log`, argsFromJobHist.hash, -1)

  await invokeCC('uploadMergeList', [mergedListIpfsinfo, type, callbackArgs.latestVersion + ''])
  // 链码中投票合并
  await invokeCC('merge', [type])

  logger.info(`[${type}]:success to generate merge list:${mergedListIpfsinfo}`)
  return true
}

/**
 * 构建ipfsinfo
 **/
function makeIpfsinfo (filename, hash, size) {
  let info = {}
  info.hash = hash
  info.path = hash
  info.name = filename
  info.size = size

  return JSON.stringify(info)
}

/**
 * 是否锁定
 **/
async function isLocked () {
  return await queryCC('isLocked', []) === 'true'
}

exports.submitAppeal = submitAppeal
exports.commitAppeal = commitAppeal

exports.submitPublishIPs = submitPublishIPs
exports.commitPublisherIPs = commitPublisherIPs

exports.uploadBlacklist = uploadBlacklist
exports.commitBlacklist = commitBlacklist

exports.merge = merge
exports.commitMerge = commitMerge

exports.isLocked = isLocked
