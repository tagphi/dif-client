'use strict'
var fs = require('fs-extra')
var path = require('path')
var execFileSync = require('child_process').execFileSync
var util = require('util')

if (process.argv.length !== 3) {
  console.log('Usage: ./install-everything.sh [MSPID]')
  process.exit(1)
}

console.log('检查依赖的一些程序以及版本....')

// 检查依赖的一些程序已经存在
// node, npm, bower
let stdout = execFileSync('npm', ['-v']).toString()

let pos = stdout.indexOf('\n')

let npmVersion = pos == -1 ? parstFloat(stdout) : parseFloat(stdout.substring(0, pos))

if (isNaN(npmVersion)) {
  console.log('npm未安装!')
  process.exit(1)
}

if (npmVersion < 5.6) {
  console.log('npm版本需要5.6以上!')
  process.exit(1)
}

stdout = execFileSync('node', ['-v']).toString()

let nodeVersion = parseFloat(stdout.substring(1))

if (nodeVersion < 8.11) {
  console.log('node版本需要8.11以上')
  process.exit(1)
}

// 检查docker 环境
stdout = execFileSync('docker', ['-v']).toString()

if (!stdout.startsWith('Docker version')) {
  console.log('docker 未安装')
  process.exit(1)
}

stdout = execFileSync('docker-compose', ['-v']).toString()

if (!stdout.startsWith('docker-compose version')) {
  console.log('docker-compose 未安装')
  process.exit(1)
}

let subFoldersContains = function (parentDir, subfolders) {
  let files = fs.readdirSync(parentDir)

  for (let i in subfolders) {
    let subfolder = subfolders[i]

    if (files.indexOf(subfolder) === -1) {
      console.log(parentDir + '/' + subfolder + ' not exits')

      return false
    }
  }

  return true
}

console.log('检查peer的证书是不是已经放置在了crypto-config目录....')

// 检查peer的证书是不是已经放置在了crypto-config目录
const PEER_CRYPTO_DIR = './crypto-config/peerOrganizations'

let files = fs.readdirSync(PEER_CRYPTO_DIR)

if (files == null || files.length === 0) {
  console.log('未发现peer的证书文件')
  process.exit(1)
}

let orgDomain = files[0]

var orgDir = path.join(PEER_CRYPTO_DIR, orgDomain)

let allFoldersExists = subFoldersContains(orgDir, ['ca', 'msp', 'peers', 'tlsca', 'users'])

if (!allFoldersExists) {
  process.exit(1)
}

if (!subFoldersContains(path.join(orgDir, 'msp'), ['admincerts', 'cacerts', 'tlscacerts'])) {
  process.exit(1)
}

files = fs.readdirSync(path.join(orgDir, 'peers'))

let peerHost = files[0]

console.log('生成配置文件....')

// 现在我们能构造所有需要的文件夹路径了
let prvKeyPath = util.format('crypto-config/peerOrganizations/%s/peers/%s/msp/keystore', orgDomain, peerHost)
let sgnCertPath = util.format('crypto-config/peerOrganizations/%s/peers/%s/msp/signcerts', orgDomain, peerHost)
let adminKeyPath = util.format('crypto-config/peerOrganizations/%s/users/Admin@%s/msp/keystore', orgDomain, orgDomain)
let adminCertPath = util.format('crypto-config/peerOrganizations/%s/users/Admin@%s/msp/signcerts', orgDomain, orgDomain)
let tlsCertPath = util.format('crypto-config/peerOrganizations/%s/msp/tlscacerts/tlsca.%s-cert.pem', orgDomain, orgDomain)
let eventUrl = util.format('grpc://%s:7053', peerHost)
let sslTargetNameOverride = peerHost
let mspDir = util.format('crypto-config/peerOrganizations/%s/peers/%s/msp', orgDomain, peerHost)
let tlsDir = util.format('crypto-config/peerOrganizations/%s/peers/%s/tls', orgDomain, peerHost)

let mspId = process.argv[2]

let tokens = {'prvKeyPath': prvKeyPath,
  'sgnCertPath': sgnCertPath,
  'adminKeyPath': adminKeyPath,
  'adminCertPath': adminCertPath,
  'tlsCertPath': tlsCertPath,
  'eventUrl': eventUrl,
  'sslTargetNameOverride': sslTargetNameOverride,
  'mspDir': mspDir,
  'tlsDir': tlsDir,
  'peerHost': peerHost,
  'mspId': mspId}

let searchNReplace = function (text) {
  Object.keys(tokens).forEach((token) => {
    let tokenp = '%' + token + '%'
    text = text.replace(new RegExp(tokenp, 'gm'), tokens[token])
  })

  return text
}

let config = fs.readFileSync(path.join(__dirname, 'config.json.tpl')).toString()
config = searchNReplace(config)
fs.writeFileSync(path.join(__dirname, 'config.json'), config)

let dockerConfig = fs.readFileSync(path.join(__dirname, 'docker-compose-peer.yaml.tpl')).toString()
dockerConfig = searchNReplace(dockerConfig)
fs.writeFileSync(path.join(__dirname, 'docker-compose-peer.yaml'), dockerConfig)

console.log("done!")
