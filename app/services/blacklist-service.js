/* eslint-disable node/no-deprecated-api */
let ipfsCli = require('../utils/ipfs-cli')

async function upload (newAddListStr, type, dataType) {
  // todo：链码查询该组织该类型的列表的全量数据的路径
  let currentListHashPath = 'QmSoxGrtJRt2FBSSWp6q5TZP6DjXhi1t9vRERpQeZDpVcz'

  // 获取到当前的列表
  let currentListFile = await ipfsCli.get(currentListHashPath)
  let currentListStr = currentListFile.content.toString()

  // 合并列表
  let mergedListStr = merge(currentListStr, newAddListStr)

  // 将增量数据和全量数据上传到ipfs
  let newListFileInfo = await ipfsCli.addByBuffer(new Buffer(newAddListStr))
  let mergeListFileInfo = await ipfsCli.addByBuffer(new Buffer(mergedListStr))

  // todo：增量hash和url上传到账本
}

function merge (currentListStr, newListStr) {
  let mergedList = {}

  // 合并当前记录
  let currentList = currentListStr.split('\n')
  currentList.forEach((item) => {
    mergedList[item] = null
  })

  // 合并新的记录
  let newList = newListStr.split('\n')
  newList.forEach((item) => {
    mergedList[item] = null
  })

  let finnalList = []
  for (let item in mergedList) {
    finnalList.push(item)
  }

  return _recordsToRows(finnalList)
}

function _recordsToRows (recordsList) {
  let rows = ''
  let len = recordsList.length
  for (let i = 0; i < len; i++) {
    let record = recordsList[i]
    if (i === len - 1) {
      rows += record
      break
    }
    rows += record + '\n'
  }

  return rows
}

exports.upload = upload
exports.merge = merge
