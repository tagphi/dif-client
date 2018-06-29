/* eslint-disable no-trailing-spaces */
let tar = require('tar')
let Q = require('q')
let fs = require('fs-extra')

function xz (zipedFilePath, destDir) {
  fs.removeSync(destDir)
  fs.ensureDirSync(destDir)

  let defered = Q.defer()

  tar.x({
    file: zipedFilePath,
    cwd: destDir
  }).then(function () {
    defered.resolve(true)
  })

  return defered.promise
}

exports.xz = xz
