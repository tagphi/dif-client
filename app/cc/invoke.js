'use strict'

var helper = require('../../common/helper.js')
var CONFIG = require('../../config')
var chaincodeUtil = require('../../common/chaincode-util')

var invoke = async function (fcn, args) {
    let client = await helper.getClient(CONFIG.msp.id, true)
    let channel = await helper.getChannel(client)
    let tx_id = client.newTransactionID(true)

    let request = {
        chaincodeId: 'dif', // TODO: 配置中读取
        fcn: fcn,
        args: args,
        txId: tx_id,
        chainId: CONFIG.channel_name
    }

    request.targets = helper.getEndorsers(client)

    await chaincodeUtil.sendNConfirm(tx_id, channel,
        async function () {
            return channel.sendTransactionProposal(request, 180000)
        },
        function (proposalResp) { // TODO: 可能不需要所有背书节点的成功背书，背书策略应该更宽松一点
            return (proposalResp.bad == 0)
        }
    )
}

module.exports = invoke