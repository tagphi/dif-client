# DIF - 无效流量名单共识系统

此文档描述如何部署DIF。DIF是一个基于Hyperledger Fabric开发的虚假流量黑名单共识系统。系统共分为两个部分: Admin site和Client site。Admin site用来增加删除通道(Channel)的成员，增删peers地址，以及包含创建成员身份证书以及创建Fabric网络的脚本。Client负责向背书节点发起上传增量黑名单列表，上传移除列表，查看上传历史记录，下载某成员单次上传的列表，以及下载合并后列表的请求。

## 前置条件

```
1. 配置2核2GHz 8G内存 500G硬盘（推荐1T硬盘）
2. docker-compose version > 1.20.1
3. Docker version > 1.13
4. 准备一个peer0.[公司Domain]的域名指向部署peer的机器
5. 定一个组织的MSPID作为在Fabric网络的标识，可以为无空格和特殊字符的大小写组合。比如RTBAsia, hdtMEDIA等
```

**Note**

- 建议创建docker:docker用户/用户组，并使用docker用户启动docker守护服务，直接使用root用户启动docker守护服务在安装dif的过程中可能会遇到权限问题导致失败
- 建议使用非root用户操作，并将当前用户加入docker用户组，避免不必要权限问题导致的异常

## 部署Client Site

## 部署步骤

- 防火墙打开或放通端口

    - 7051、7052、7053
    - 4001、4002、5001
    - 8080、8081

- 下载安装包 https://github.com/tagphi/dif-client/releases/download/2.0.0/dif-client-v2.0.0.tar.gz并解压

- 拷贝组织证书到dif-client/crypto-config/ 目录下

    参考文档 [cryptogen-doc.md](./cryptogen-doc.md) 生成证书，并将`crypto-config/peerOrgnizations/[组织domain]/msp`目录发给RTBAsia (cong.liu@rtbasia.com)。`crypto-config/peerOrgnizations/`底下所有的文件拷贝到`dif-client/crypto-config/peerOrgnizations`下

    确认证书存在

    * 确保order tls证书在dif-client/crypto-config/order-tls目录下
    * 确保本组织的证书在dif-client/crypto-config/peerOrganizations目录下

- 配置组织的msp id到文件 `msp_id.conf`

    ```shell
    echo 成员MSPID > msp_id.conf
    ```

- 将组织证书拷贝到`crypto-config/peerOrganizations`目录下，最终正确的证书结构如下

```
crypto-config/
├── order-tls
│   └── tlsca.rtbasia.com-cert.pem
└── peerOrganizations
    └── 【组织域名：如rtbasia.com】
```

- 从RTBAsia运维或开发人员获取 `swarm.key` - dif-ipfs私网秘钥，放置到解压目录下

- 生成配置

```
./generate_config.sh
```

- 启动

```shell
./start-peer-cli.sh

# 首次启动后会需要一段时间同步区块，在这段时间服务是不可用的。
# 查看区块同步的高度
docker logs --tail 100 peer容器名 2>&1| grep "Committed block"

# 区块同步完成后访问http://你的peer域名:8081，用户名密码在config.json中配置
```

- 停止并清理数据

```
./clear-peer-cli.sh
```

