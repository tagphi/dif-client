/* eslint-disable node/no-deprecated-api,no-trailing-spaces */

let ipfsCli = require('../utils/ipfs-cli')
let queryCC = require('../cc/query')
let invokeCC = require('../cc/invoke')

async function upload (newAddListStr, type, dataType) {
  let filename = type + '-' + new Date().getTime() + '.txt'
  /* 移除列表 */
  if (dataType === 'remove') {
    // 将增量数据上传到ipfs
    let newListFileInfo = await ipfsCli.addByStr(newAddListStr)
    newListFileInfo.name = filename
    // 保存到账本
    await invokeCC('uploadRemoveList', [JSON.stringify(newListFileInfo), type])
    return
  }

  /* 黑名单 */
  // 链码查询该组织该类型的列表的全量数据的路径
  let currentListInfo = await queryCC('getOrgList', [type])
  let currentListStr = JSON.stringify([])

  if (currentListInfo) {
    // 获取到当前的列表
    currentListInfo = JSON.parse(currentListInfo)
    let currentListFile = await ipfsCli.get(currentListInfo.path)
    currentListStr = currentListFile.content.toString()
  }
  // 合并列表
  let mergedListStr = _mergeDeltaList(currentListStr, newAddListStr)

  // 将增量数据和全量数据上传到ipfs
  let newListFileInfo = await ipfsCli.addByStr(newAddListStr)
  newListFileInfo.name = filename
  let mergeListFileInfo = await ipfsCli.addByStr(mergedListStr)
  mergeListFileInfo.name = filename

  await invokeCC('deltaUpload', [JSON.stringify(newListFileInfo), type])
  await invokeCC('fullUpload', [JSON.stringify(mergeListFileInfo), type])
}

function _mergeDeltaList (oldListStr, deltaList) {
  let orgSet = new Set()

  // 保存旧的
  if (oldListStr) {
    let oldList = JSON.parse(oldListStr)
    oldList.forEach((item) => {
      orgSet.add(item)
    })
  }

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

  return JSON.stringify(Array.from(orgSet))
}

exports.upload = upload
