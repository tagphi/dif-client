# Release Note 2.4.0

## 目录

* 1. [新增功能](#)
* 2. [前置条件](#-1)
* 3. [部署Client Site](#ClientSite)
	* 3.1. [拷贝组织证书到dif-client/crypto-config/ 目录下](#dif-clientcrypto-config)
	* 3.2. [确认证书存在](#-1)
* 4. [部署步骤](#-1)
* 5. [从1.x（非docker版）版本升级](#1.xdocker)
* 6. [从2.x（docker版）版本升级](#2.xdocker)


## 新增功能

- 实现合并黑名单时自动剔除灰名单；
- 实现成员名分页搜索提交历史；
-  实现心跳同步客户端状态；
-  使用新的版本机制；

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

### 拷贝组织证书到dif-client/crypto-config/ 目录下

参考文档 [cryptogen-doc.md](./cryptogen-doc.md) 生成证书，并将`crypto-config/peerOrgnizations/[组织domain]/msp`目录发给RTBAsia。`crypto-config/peerOrgnizations/`底下所有的文件拷贝到`dif-client/crypto-config/peerOrgnizations`下。 

### 确认证书存在

* 确保order tls证书在dif-client/crypto-config/order-tls目录下
* 确保本组织的证书在dif-client/crypto-config/peerOrganizations目录下

## 部署步骤

- 防火墙打开或放通端口**

    - 7051、7052、7053
    - 4001、4002、5001
    - 8080、8081

- 下载安装包 [https://github.com/tagphi/dif-client/release/dif-client-v2.0.0.tar.gz](https://github.com/tagphi/dif-client/release/dif-client-v2.0.0.tar.gz) 并解压

- 配置组织的msp id到文件 `msp_id.conf`

    ```shell
    cat 成员MSPID > msp_id.conf
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

```
./start-peer-cli.sh
```

- 停止并清理数据

```
./clear-peer-cli.sh
```

## 从1.x（非docker版）版本升级

**注意**:`请将证书备份`

因最初的1.x版本并未使用docker容器技术，部署和升级极为不便，因此不再支持。建议直接采用最新的2.x版本，然后按照文档一步步操作，非常方便。


## 从2.x（docker版）版本升级

2.x版本已采用docker容器化技术，可以简单快速升级

**注意**:`请将证书备份`

- 1、首先将v2.4.0包中的update_config.sh拷贝到原v2.x部署的主目录中
- 2、在原v2.x主目录中执行以下脚本即可

```shell
# 更新配置
./update_config.sh

# 拉取新的dif-client镜像
docker pull dockerhub.rtbasia.com/dif/dif-client
# 重启dif-client
docker-compose  -f docker-compose-peer.yaml up -d  dif-client

# 拉取新的dif-merge镜像
docker pull dockerhub.rtbasia.com/dif/dif-merge
# 重启dif-merge
docker-compose  -f docker-compose-peer.yaml up -d  dif-merge
```

