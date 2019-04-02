{
    "msp": {
        "id": "%mspId%",
        "prv_key_path": "../%prvKeyPath%",
        "sgn_cert_path": "../%sgnCertPath%",
        "admin_key_path": "../%adminKeyPath%",
        "admin_cert_path": "../%adminCertPath%"
    },
    "orderer": {
        "tls_cert_path": "../crypto-config/order-tls/tlsca.rtbasia.com-cert.pem",
        "url": "grpc://orderer2.dif.rtbasia.com:7050",
        "ssl_target_name_override": "orderer2.dif.rtbasia.com",
        "timeout": 30000
    },
    "peer": {
        "tls_cert_path": "../%tlsCertPath%",
        "event_url": "%eventUrl%",
        "ssl_target_name_override": "%sslTargetNameOverride%",
        "event_timeout": 30000,
        "request_timeout":60000
    },
    "site": {
        "dev":true,
        "watcher":false,
        "adminAddr":"http://admin.dif.rtbasia.com:8080",
        "key_value_store": "/tmp/dif-kvs/",
        "port": 8081,
        "username": "admin",
        "password": "password",
        "jwt_expiretime": "36000",
        "jwt_secret": "thisismysecret",
        "pageSize": 10,
        "req_timeout":900000,
        "res_timeout":900000,
        "whitelist":[
            "127.0.0.1",
            "::1"
        ],
        "upload": {
            "maxFilesize":10
        },
        "cron":{
            "enabled":true,
            "query_cc_install":5,
            "merge_interval":60
        },
        "ipfs":{
            "host":"175.6.228.227",
            "port":5001,
            "timeout":900
        },
        "mergeServiceUrl":"http://dif-merge:8082",
        "callbackUrl":"http://dif-client:8081/blacklist/callback"
    },
    "channel_name": "difchannel"
}