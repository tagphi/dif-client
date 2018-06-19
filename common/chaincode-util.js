var fs = require('fs-extra')

var util = require('util')
var path = require('path')

var log4js = require('log4js')
var logger = log4js.getLogger('chaincode-util')
var CONFIG = require('../config.json')
var helper = require('./helper')

/**
 * 调用chaincode, 获取proposal response。发送给order然后确认本组织peer收到交易
 */
var sendNConfirm = async function (txId, channel, sendFn, validateProposalFn) {
  let results = await sendFn()

  let proposalResponses = results[0]
  let proposal = results[1]

  let goodCnt = 0
  let badCnt = 0

  for (let i in proposalResponses) {
    if (proposalResponses && proposalResponses[i].response &&
            proposalResponses[i].response.status === 200) {
      goodCnt++
    } else {
      badCnt++
    }
  }

  logger.info(util.format('Got endorsement, %d are good, %d are bad', goodCnt, badCnt))

  let endorsementOK = validateProposalFn({good: goodCnt, bad: badCnt, proposalResponses: proposalResponses})

  if (!endorsementOK) {
    logger.error('Did not get enough endorsement, invocation failed')

    throw new Error('Not enough endorsement')
  }

  let client = await helper.getClient(CONFIG.msp.id, true)

  let request = {
    proposalResponses: proposalResponses,
    proposal: proposal
  }

  let deployId = txId.getTransactionID()

  let eh = client.newEventHub()

  let data = fs.readFileSync(path.join(__dirname, CONFIG.peer.tls_cert_path))

  eh.setPeerAddr(CONFIG.peer.event_url, {
    pem: Buffer.from(data).toString(),
    'ssl-target-name-override': CONFIG.peer.ssl_target_name_override
  })

  eh.connect()

  let txPromise = new Promise((resolve, reject) => {
    let handle = setTimeout(() => {
      eh.disconnect()
      reject(new Error('Timeout to wait tx sync to peer'))
    }, CONFIG.peer.event_timeout)

    eh.registerTxEvent(deployId, (tx, code) => {
      logger.info(
        'The chaincode instantiate transaction has been committed on peer ' +
                eh._ep._endpoint.addr)
      clearTimeout(handle)
      eh.unregisterTxEvent(deployId)
      eh.disconnect()

      if (code !== 'VALID') {
        logger.error('Transaction was invalid, code = ' + code)
        reject(new Error('Transaction was invalid, code = ' + code))
      } else {
        logger.info('Transaction was valid.')
        resolve()
      }
    })
  })

  var sendPromise = channel.sendTransaction(request)

  return Promise.all([sendPromise].concat([txPromise])).then((results) => {
    logger.debug('Tx was sent to order and our peer received it.')
    return results[0]
  }).catch((err) => {
    logger.error('Failed to send transaction and get notifications within the timeout period.')

    throw err
  })
}

exports.sendNConfirm = sendNConfirm
