'use strict';
var helper = require("./common/helper");
var CONFIG = require("./config.json");

var path = require('path');
var fs = require('fs-extra');
let util = require('util');

var log4js = require('log4js');
var logger = log4js.getLogger('install-chaincode');

var installChaincode = async function() {
    let client = await helper.getClient(true);
    let peers = helper.getOwnPeers(client);

    var request = {
            targets: peers,
            chaincodePath: "./chaincode/node",
            chaincodeId: "dif",
            chaincodeType: "node",
            chaincodeVersion: "v2" // TODO: 这些信息应该都要从服务器取得
        };
    
    let results = await client.installChaincode(request);

    let proposalResponses = results[0];
    let proposal = results[1];

    var all_good = true;

    for (var i in proposalResponses) {
        let one_good = false;

        if (proposalResponses && proposalResponses[i].response &&
            proposalResponses[i].response.status === 200) {
            one_good = true;
            logger.info('install proposal was good');
        } else {
            logger.error('install proposal was bad');
        }

        all_good = all_good & one_good;
    }

    if (all_good) {
        logger.info(util.format(
            'Successfully sent install Proposal and received ProposalResponse: Status - %s',
            proposalResponses[0].response.status));
    } else {
        logger.error(
            'Failed to send install Proposal or receive valid response. Response null or status is not 200. exiting...'
        );
    }
}

installChaincode();