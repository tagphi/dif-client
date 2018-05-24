'use strict';
var helper = require("./common/helper");
var CONFIG = require("./config.json");
var path = require('path');
var fs = require('fs-extra');

var getGenesisBlock = async function(client, channel) {
    let tx_id = client.newTransactionID();

    let request = {
        txId :  tx_id
    };

    let genesisBlock = await channel.getGenesisBlock(request);

    return genesisBlock;
}

var joinPeer = async function() {
    let client = await helper.getClient(true);
    let channel = await helper.getChannel(client);

    let genesisBlock = await getGenesisBlock(client, channel);

    let tx_id = client.newTransactionID();

    let request = {
        block : genesisBlock,
        txId :  tx_id
    };

    let peersJsonStr = fs.readFileSync("./peers.json");
    let peersJson = JSON.parse(Buffer.from(peersJsonStr).toString());

    for (var key in peersJson) {
        let peerJson = peersJson[key];

        // 这是本组织Peer，加入网路
        if (peerJson.MSPID == CONFIG.msp.id) {
            let data = fs.readFileSync(CONFIG.peer.tls_cert_path);

            let peer = client.newPeer(
                peerJson.url,
                {
                    pem: Buffer.from(data).toString(),
                    'ssl-target-name-override': peerJson["ssl-target-name-override"],
                    'request-timeout' : 120
                }
            );

            channel.addPeer(peer);
            break;
        }
    }

    return channel.joinChannel(request, 30000);
}

var main = async function() {
    await joinPeer();
}

main();