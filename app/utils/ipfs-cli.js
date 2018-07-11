/* eslint-disable node/no-deprecated-api */
/**
 * ipfs文件系统客户端
 **/
const CONFIG_IPFS = require('../../config').site.ipfs
const ipfs = require('ipfs-api')(CONFIG_IPFS.host, CONFIG_IPFS.port)
let fs = require('fs-extra')

/**
 files示例：
 {
    path: 'QmW44EoovGRsW7EHKRiMSPyRkhKykikvjgQSAQu2qYYNsX',
    hash: 'QmW44EoovGRsW7EHKRiMSPyRkhKykikvjgQSAQu2qYYNsX',
    size: 22,
    origin: '/Users/kiky/kk/js-ipfs-api/test/input/upload2'
  }
 **/
function add (filePath) {
  let fileToAdd = fs.readFileSync(filePath)
  return addByBuffer(fileToAdd)
}

function addByBuffer (buf) {
  let addPromise = new Promise((resolve, reject) => {
    ipfs.add(buf, function (err, files) {
      if (err || typeof files === 'undefined') {
        reject(err)
      } else {
        let file = files.pop()
        resolve(file)
      }
    })
  })

  return addPromise
}

function addByStr (str) {
  return addByBuffer(new Buffer(str))
}

/**
 files示例：
 [ { path: 'QmZAM3NBJsFSPb6c5Up8DEsYadznZytk7suJPGoqHTLbHm',
    hash: 'QmZAM3NBJsFSPb6c5Up8DEsYadznZytk7suJPGoqHTLbHm',
    size: 21,
    origin: '/Users/kiky/kk/js-ipfs-api/test/input/upload' },...]
 **/
async function addMulti (filePaths) {
  let allPromises = []
  filePaths.forEach((file) => {
    let addPromise = add(file)
    allPromises.push(addPromise)
  })

  let files = await Promise.all(allPromises)
  return files
}

/**
 files示例：
 { path: 'QmZAM3NBJsFSPb6c5Up8DEsYadznZytk7suJPGoqHTLbHm',
    content: <Buffer 49 20 61 6d 20 75 70 6c 6f 61 64 65 64> }
 **/
function get (hashPath) {
  let getPromise = new Promise((resolve, reject) => {
    ipfs.get(hashPath, function (err, files) {
      if (err || typeof files === 'undefined') {
        reject(err)
      } else {
        resolve(files.pop())
      }
    })
  })

  return getPromise
}

/**
 files示例：
 [{ path: 'QmZAM3NBJsFSPb6c5Up8DEsYadznZytk7suJPGoqHTLbHm',
 content: <Buffer 49 20 61 6d 20 75 70 6c 6f 61 64 65 64> },...]
 **/
async function getMulti (hashPaths) {
  let allPromises = []
  hashPaths.forEach(path => {
    let getPromise = get(path)
    allPromises.push(getPromise)
  })
  let files = await Promise.all(allPromises)
  return files
}

exports.add = add
exports.addByBuffer = addByBuffer
exports.addByStr = addByStr
exports.addMulti = addMulti
exports.get = get
exports.getMulti = getMulti
