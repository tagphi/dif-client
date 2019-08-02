# Release Note 2.0.0

## 优化

- dif-client, dif-merge 打包成镜像，并和ipfs, peer配置于同一docker-compose.yml中
- 一个命令启动所有组件，启动脚本运行时自动加入网络

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


## 从旧版本升级

- 如果部署过旧版本，需要停止原来服务并清理掉volume中数据。

**注意**:`请将证书备份`


```shell
# 停止peer, 在dif-client目录下运行
docker-compose -f docker-compose-peer.yaml down --volumes

# 停止dif-client，在dif-client目录下运行
forever stop app/app.js #如果失败可以直接kill掉forever和node app.js进程

# 停止ipfs, 在ipfs目录下运行
docker-compose down --volumes

# 停止dif-merge, 在dif-merge目录下运行
bin/stop.sh
```

