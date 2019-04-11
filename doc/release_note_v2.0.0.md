# Release Note 2.0.0

## 优化

- 服务完全docker化，将部署简化为一条简单的自动化脚本


## 升级部署

- **防火墙打开或放通端口**

    - 7051、7052、7053
    - 4001、4002、5001
    - 8080、8081

- 配置组织的msp id到文件 `msp_id.conf`

- 将组织证书配置到`crypto-config/peerOrganizations`目录下，最终正确的证书结构如下

```
crypto-config/
├── order-tls
│   └── tlsca.rtbasia.com-cert.pem
└── peerOrganizations
    └── 【组织域名：如rtbasia.com】
```

- 从RTBAsia运维或开发人员获取 `swarm.key` - dif-ipfs私网秘钥

- 生成配置

```
./generate_config.sh
```

- 启动

```
./start-peer-cli.sh
```

- 清理

```
./clear-peer-cli.sh
```
