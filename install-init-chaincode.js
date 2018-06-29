'use strict'

let installCC = require('./install-chaincode')

;(function init () {
  installCC.installChaincode('dif', 'v6')
})()
