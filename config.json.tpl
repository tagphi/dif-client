{
    "msp": {
        "id": "RTBAsia",
        "prv_key_path": "../%prvKeyPath%",
        "sgn_cert_path": "../%sgnCertPath%",
        "admin_key_path": "../%adminKeyPath%",
        "admin_cert_path": "../%adminCertPath%"
    },
    "orderer": {
        "tls_cert_path": "../crypto-config/order-tls/tlsca.rtbasia.com-cert.pem",
        "url": "grpc://orderer.dif.rtbasia.com:7050",
        "ssl_target_name_override": "orderer.dif.rtbasia.com",
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
        "adminAddr":"http://localhost:8080",
        "key_value_store": "/tmp/dif-kvs/",
        "port": 8081,
        "username": "admin",
        "password": "password",
        "jwt_expiretime": "36000",
        "jwt_secret": "thisismysecret",
        "upload": {
            "maxFilesize":1024
        },
        "cron":{
            "query_cc_install":120
        }
    },
    "channel_name": "difchannel"
}