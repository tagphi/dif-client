/* eslint-disable no-trailing-spaces */
let request = require('request')
let fs = require('fs-extra')
let Q = require('q')

function downloadFile (downloadUrl, saveDir, fileName) {
  // 清空链码目录
  fs.removeSync(saveDir)
  fs.ensureDirSync(saveDir)

  let defered = Q.defer()

  // 下载并写入链码目录
  let ccPathOut = fs.createWriteStream(saveDir + '/' + fileName)
  request(downloadUrl)
    .pipe(ccPathOut)
    .on('finish', function () {
      defered.resolve(true)
    })

  return defered.promise
}

exports.downloadFile = downloadFile
