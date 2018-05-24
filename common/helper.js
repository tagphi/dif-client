'use strict';

var Client = require('fabric-client');
var CONFIG = require('../config.json');
var path = require('path');
var fs = require('fs-extra');

var getChannel = async function(client) {
    let channel = client.newChannel(CONFIG.channel_name);

    let orderer = __newOrderer(client);
    channel.addOrderer(orderer);

    return channel;
}

var __newOrderer = function(client) {
    let data = fs.readFileSync(CONFIG.orderer.tls_cert_path);
    let caroots = Buffer.from(data).toString();

    return client.newOrderer(CONFIG.orderer.url, {
        'pem': caroots,
        'ssl-target-name-override': CONFIG.orderer.ssl_target_name_override,
        'request-timeout' : CONFIG.orderer.timeout
    });
}

var __readAllFiles = function(dir) {
    var files = fs.readdirSync(dir);
    var certs = [];
    files.forEach((file_name) => {
        let file_path = path.join(dir, file_name);
        let data = fs.readFileSync(file_path);
        certs.push(data);
    });
    return certs;
}

var __getCryptoDataPEM = function(keyPath) {
    let data = CONFIG.msp.admin_key_path;
    let pem = Buffer.from(__readAllFiles(keyPath)[0]).toString();

    return pem;
}

var __setAdminSigningIdentity = function(client) {
    // set admin identity
    var keyPEM = __getCryptoDataPEM(CONFIG.msp.admin_key_path);
    var certPEM = __getCryptoDataPEM(CONFIG.msp.admin_cert_path);

    client.setAdminSigningIdentity(keyPEM, certPEM, CONFIG.msp.id);
}

var getClient = async function (useAdmin) {
    let client = new Client();
    let store = await Client.newDefaultKeyValueStore({
                            path: CONFIG.site.key_value_store
                        });

    client.setStateStore(store);

    await __setUserContext(client, useAdmin);
    
    __setAdminSigningIdentity(client);

    return client;
}

var __setUserContext = async function(client, useAdmin) {
    client._userContext = null;

    let username = useAdmin ? "admin" : "user1";
    let user = await client.getUserContext(username, true);

    if (user === null) {
        var privateKeyPEM = null;
        var signedCertPEM = null;

        if (useAdmin) { // 使用admin的证书登记此user
            privateKeyPEM = getCryptoDataPEM(CONFIG.msp.admin_key_path);
            signedCertPEM = getCryptoDataPEM(CONFIG.msp.admin_cert_path);
        } else {
            privateKeyPEM = getCryptoDataPEM(CONFIG.msp.prv_key_path);
            signedCertPEM = getCryptoDataPEM(CONFIG.msp.sgn_cert_path);
        }

        user = await client.createUser({username: username,
                                        mspid: CONFIG.msp.id,
                                        cryptoContent: {privateKeyPEM: privateKeyPEM, signedCertPEM: signedCertPEM}});
    }

    return user;
}

exports.getClient = getClient;
exports.getChannel = getChannel;