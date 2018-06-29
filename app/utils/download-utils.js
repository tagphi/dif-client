/* eslint-disable no-trailing-spaces,no-new */

let request = require('request')
let fs = require('fs-extra')

function downloadFile (downloadUrl, saveDir, fileName) {
  // 清空链码目录
  fs.removeSync(saveDir)
  fs.ensureDirSync(saveDir)

  let downloadPromise = new Promise(function (resolve, reject) {
    // 下载并写入链码目录
    let ccPathOut = fs.createWriteStream(saveDir + '/' + fileName)
    request(downloadUrl)
      .pipe(ccPathOut)
      .on('finish', function () {
        resolve(true)
      })
  })

  return downloadPromise
}

exports.downloadFile = downloadFile
