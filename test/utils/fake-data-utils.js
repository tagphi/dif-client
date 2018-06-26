/**
 * 假数据工具
 **/
let path = require('path')
let fs = require('fs')

/**
 * 设备列表
 **/
function genDevice (size, isRemove) {
  // 拼接
  let dataStr = ''
  for (let i = 0; i < size; i++) {
    dataStr += 'device' + i + '\tIMEI\tMD5'

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

  let dataPath = path.join(__dirname, '../data/' + filename)
  fs.writeFile(dataPath, dataStr)
}

exports.genDevice = genDevice
