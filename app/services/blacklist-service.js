/* eslint-disable node/no-deprecated-api,no-trailing-spaces */

let queryCC = require('../cc/query')
let invokeCC = require('../cc/invoke')
var CONFIG = require('../../config.json')
var CONFIG_IPFS = require('../../config.json').site.ipfs
var agent = require('superagent-promise')(require('superagent'), Promise)
let ADMIN_ADDR = CONFIG.site.adminAddr
let logger = require('../utils/logger-utils').logger
let commonUtils = require('util')

let ipfsCliLocal = require('../utils/ipfs-cli')
let ipfsCliRemote = require('../utils/ipfs-cli').bind(CONFIG_IPFS.host, CONFIG_IPFS.port)

async function upload (newAddListStr, type, dataType) {
  let filename = type + '-' + new Date().getTime() + '.txt'
  /* 移除列表 */
  if (dataType === 'remove') {
    // 将增量数据上传到ipfs
    let newRmListFileInfo = await ipfsCliRemote.addByStr(newAddListStr)
    newRmListFileInfo.name = filename
    newRmListFileInfo = JSON.stringify(newRmListFileInfo)
    // 保存到账本
    await invokeCC('uploadRemoveList', [newRmListFileInfo, type])

    let msg = commonUtils.format('【%s】success to upload remove list:%s',
      type, newRmListFileInfo)
    logger.info(msg)
    return
  }

  /* 黑名单 */
  // 链码查询该组织该类型的列表的全量数据的路径
  let currentListStr = await _getCurrentFullListOfOrg(type)

  // 合并列表
  let mergedListStr = _mergeDeltaList(currentListStr, newAddListStr)

  // 将增量数据和全量数据上传到ipfs
  await _uploadDeltaAndFullList(newAddListStr, filename, mergedListStr, type)
}

async function merge (type, latestVersion) {
  // 获取共识的移除清单
  let rmSetOfConsensus = await _getConsensusedRmSet(type)

  // 获取合并的全量列表
  let mergedFullList = await _getMergedFullListOfOrgs(type)

  // 剔除不符合的记录
  mergedFullList = _delIllegalRecords(mergedFullList, rmSetOfConsensus, type)

  // 将投票集合转换为列表
  let formattedMergedStr = _formatMergedList(mergedFullList)

  /* 上传最终的合并列表 */
  // 1 上传到ipfs
  let ipfsInfo = await ipfsCliRemote.addByStr(formattedMergedStr)
  ipfsInfo.name = type + '-merged-' + new Date().getTime() + '.txt'
  // 2 上传到账本
  if (!latestVersion) {
    let version = await queryCC('version', [])
    latestVersion = parseInt(version) + 1
  }
  ipfsInfo = JSON.stringify(ipfsInfo)
  await invokeCC('uploadMergeList', [ipfsInfo, type, latestVersion + ''])

  // 链码中投票合并
  await invokeCC('merge', [type])
  let msg = commonUtils.format('【%s】new merge list:%s',
    type, ipfsInfo)
  logger.info(msg)
}

/**
 * 获取该组织的该类型的当前全量列表
 **/
async function _getCurrentFullListOfOrg (type) {
  let curFullListInfo = await queryCC('getOrgList', [type])
  let curFullListStr = JSON.stringify([])

  if (curFullListInfo) {
    let msg = commonUtils.format('【%s】current full list:%s',
      type, curFullListInfo)
    logger.info(msg)

    // 获取到当前的列表
    curFullListInfo = JSON.parse(curFullListInfo)
    let currentListFile = await ipfsCliLocal.get(curFullListInfo.path, curFullListInfo.name)
    if (currentListFile.err) { // 超时
      return curFullListStr
    }
    curFullListStr = currentListFile.content.toString()
  }
  return curFullListStr
}

function _mergeDeltaList (oldListStr, deltaList) {
  let orgSet = new Set()

  // 保存新的
  let lines = deltaList.split('\n')
  // 合并到公司设备黑名单列表
  lines.forEach((row) => {
    if (!row) return

    let flagPos = row.lastIndexOf('\t')
    let record = row.substring(0, flagPos)
    flagPos++
    let flag = row.substring(flagPos)

    if (flag === '1') { // 增加
      orgSet.add(record)
    } else if (flag === '0') { // 删除
      orgSet.delete(record)
    }
  })

  // 保存旧的
  if (oldListStr) {
    let oldList = JSON.parse(oldListStr)
    oldList.forEach((item) => {
      orgSet.add(item)
    })
  }

  return JSON.stringify(Array.from(orgSet))
}

async function _uploadDeltaAndFullList (newAddListStr, filename, mergedListStr, type) {
  let newListFileInfo = await ipfsCliRemote.addByStr(newAddListStr)
  newListFileInfo.name = filename
  let mergeListFileInfo = await ipfsCliRemote.addByStr(mergedListStr)
  mergeListFileInfo.name = filename

  newListFileInfo = JSON.stringify(newListFileInfo)
  mergeListFileInfo = JSON.stringify(mergeListFileInfo)
  await invokeCC('deltaUpload', [newListFileInfo, type])
  await invokeCC('fullUpload', [mergeListFileInfo, type])

  let msg = commonUtils.format('【%s】success to upload delta list:%s',
    type, newListFileInfo)
  logger.info(msg)
  msg = commonUtils.format('【%s】success to upload full list:%s',
    type, mergeListFileInfo)
  logger.info(msg)
}

/**
 * 获取共识的移除清单
 **/
async function _getConsensusedRmSet (type) {
  // 从链码获取hash列表
  let rmListOfOrgs = await queryCC('getAllOrgsRemoveList', [type])
  let msg = commonUtils.format('【%s】current orgs remove list:%s',
    type, rmListOfOrgs)
  logger.info(msg)

  // 下载全部移除列表数据
  let rmListFileInfosOfOrgs = await _downloadDataFromIPFS(rmListOfOrgs)

  // 合并所有组织的移除列表的投票
  let mergedRmList = _voteEveryRecord(rmListFileInfosOfOrgs)

  // 提取共识名单
  let result = await _extractListOfConsensus(mergedRmList)
  return result
}

/**
 * 提取共识名单
 **/
async function _extractListOfConsensus (mergedRmList) {
  // 获取共识标准
  let minRmVotesOfConsensus = await _getConsensusLimit()

  let rmSetOfConsensus = new Set()
  for (let record in mergedRmList) {
    let recordVotes = mergedRmList[record].size
    if (recordVotes >= minRmVotesOfConsensus) {
      rmSetOfConsensus.add(record)
    }
  }

  return rmSetOfConsensus
}

async function _getConsensusLimit () {
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
  let msg = commonUtils.format('【%s】current orgs full list:%s',
    type, fullListOfArgs)
  logger.info(msg)

  // 下载全量列表
  let fullListFileInfos = await _downloadDataFromIPFS(fullListOfArgs)

  // 合并所有组织的记录的投票
  let mergedFullList = _voteEveryRecord(fullListFileInfos)
  return mergedFullList
}

/**
 * 下载数据文件
 **/
async function _downloadDataFromIPFS (listOfOrgs) {
  listOfOrgs = JSON.parse(listOfOrgs)
  let msgIDsOfOrgs = []
  let listPathsOfOrgs = []
  listOfOrgs.forEach(function (listInfoOfOneOrg) {
    msgIDsOfOrgs.push(listInfoOfOneOrg.mspId)
    listPathsOfOrgs.push(listInfoOfOneOrg.ipfsInfo.path)
  })

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
 *
 **/
function _voteEveryRecord (listFileInfos) {
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
 *  剔除不符合的记录
 **/
function _delIllegalRecords (mergedFullList, rmSetOfConsensus, type) {
  let tmpMergedFullList = {}
  for (let record in mergedFullList) {
    // 剔除移除列表中的记录
    let isRmItem = rmSetOfConsensus.has(record)
    if (isRmItem) continue

    // 剔除未达到指定票数的记录
    if (type === 'ip' || type === 'default') { // 必须2个以上投票
      let votes = mergedFullList[record].size
      if (votes < 2) {
        continue
      }
    }

    tmpMergedFullList[record] = mergedFullList[record]
  }

  return tmpMergedFullList
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

exports.upload = upload
exports.merge = merge
