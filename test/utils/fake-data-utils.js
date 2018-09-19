/**
 * 假数据工具
 **/
let path = require('path')
let fs = require('fs')
let uuid = require('uuid')

/**
 * 设备列表
 **/
function genDevice (size, isRemove) {
  // 拼接
  let dataStr = ''
  for (let i = 0; i < size; i++) {
    let deviceID = uuid.v1()
    dataStr += deviceID + '\tIMEI\tMD5'

    if (!isRemove) { // 非移除列表
      dataStr += '\t1'
    }

    if (i !== size - 1) {
      dataStr += '\n'
    }
  }

  // 写入文件
  let filename = 'device'
  if (isRemove) { // 移除列表
    filename += '[remove]'
  }
  filename += '(' + size + ')--' + new Date().getTime() + '.txt'

  // let dataPath = path.join(__dirname, '../data/' + filename)
  let dataPath = path.join(__dirname, '../data/big/' + filename)
  fs.writeFile(dataPath, dataStr)
}

/**
 * 随机整数
 **/
function getRandomIntInclusive (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min // The maximum is inclusive and the minimum is inclusive
}

exports.genDevice = genDevice
