/* eslint-disable node/no-deprecated-api */
/**
 * ipfs文件系统客户端
 **/
const CONFIG_IPFS = require('../../config').site.ipfs
const ipfs = require('ipfs-api')(CONFIG_IPFS.host, CONFIG_IPFS.port)
let fs = require('fs-extra')

// 请求超时
let requestTimeout = 60 * 1000

function setRequestTimeout (timeout) {
  requestTimeout = timeout
  return this
}

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

function addByBuffer (buffer) {
  let addPromise = new Promise((resolve, reject) => {
    ipfs.add(new Buffer(buffer), function (err, files) {
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
function get (path, id, timeout) {
  let getPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      let err = new Error('request timeout:[id]-' + id + '\t[path]-' + path)
      err.err = true
      resolve(err)
    }, timeout || requestTimeout)

    ipfs.get(path, function (err, files) {
      if (err || typeof files === 'undefined') {
        reject(err)
      } else {
        let file = files.pop()
        if (id) {
          file.id = id
        }
        resolve(file)
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
async function getMulti (paths, ids, timeout) {
  let allPromises = []
  paths.forEach((path, pos) => {
    let getPromise = get(path, ids[pos], timeout)
    allPromises.push(getPromise)
  })
  let files = await Promise.all(allPromises)
  return files
}

exports.setRequestTimeout = setRequestTimeout

exports.add = add
exports.addByBuffer = addByBuffer
exports.addByStr = addByStr
exports.addMulti = addMulti

exports.get = get
exports.getMulti = getMulti
