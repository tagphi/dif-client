let queryCC = require('./query-installed-chaincode')

async function caller () {
  await queryCC.queryInstalledCC()
}

caller()
