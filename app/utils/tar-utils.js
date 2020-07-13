/* eslint-disable no-trailing-spaces */
let tar = require('tar')
let fs = require('fs-extra')

function xz (zipedFilePath, destDir) {
  fs.removeSync(destDir)
  fs.ensureDirSync(destDir)

  let xzPromise = new Promise(function (resolve, reject) {
    tar.x({
      file: zipedFilePath,
      cwd: destDir
    })
      .then(() => resolve(true))
  })

  return xzPromise
}

exports.xz = xz
