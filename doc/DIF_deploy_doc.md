此文档描述如何部署DIF。DIF是一个基于Hyperledger Fabric开发的虚假流量黑名单共识系统。系统共分为两个部分: Admin site和Client site。Admin site用来增加删除通道(Channel)的成员，增删peers地址，以及包含创建成员身份证书以及创建Fabric网络的脚本。Client负责向背书节点发起上传增量黑名单列表，上传移除列表，查看上传历史记录，下载某成员单次上传的列表，以及下载合并后列表的请求。

## 前置条件

```
1. 配置2核2GHz 8G内存 500G硬盘（推荐1T硬盘）
2. docker-compose version > 1.20.1
3. Docker version > 1.13
4. Node version > 8.11+(9.0及更高版本暂不支持)
5. npm version > 5.6.0+(6.0及以上更高版本暂不支持)
6. go version > 1.10.3 (仅Admin节点)
7. JRE 或 JDK > 1.8.0
8. 开放端口7050-7053和8081
9. 准备一个peer0.[公司Domain]的域名指向部署peer的机器
10. 定一个组织的MSPID作为在Fabric网络的标识，可以为无空格和特殊字符的大小写组合。比如RTBAsia, hdtMEDIA等
```

## 部署Client Site

### 拷贝组织证书到dif-client/crypto-config/ 目录下

参考文档cryptogen-doc.md生成证书，并将crypto-config/peerOrgnizations/[组织domain]/msp 目录发给RTBAsia。crypto-config/peerOrgnizations/ 底下所有的文件拷贝到dif-client/crypto-config/peerOrgnizations下。 

### 确认证书存在

* 确保order tls证书在dif-client/crypto-config/order-tls目录下
* 确保本组织的证书在dif-client/crypto-config/peerOrganizations目录下

### 安装依赖和生成配置

```shell
# 在 dif-client 目录下运行
sudo npm install forever -g
./install-everything.sh MSPID # 将MSPID替换为组织名称
```

### 启动Peer Docker容器

```
# 在 dif-client 目录下运行
docker-compose -f docker-compose-peer.yaml up -d
```

### 加入通道

```shell
# 在 dif-client 目录下运行
node join-channel.js
```

### 安装IPFS

```shell
# 联系RTBAsia的Craig获得ipfs包
# 解压ipfs.tar.gz
# 在解压出的目录运行run.sh,如果看不到控制台输出可能要再运行一遍
./run.sh
```

### 启动Client Site Web

 ```Shell
# 在 dif-client/app 目录下运行
forever start app.js

#使用http://域名:8081 访问客户端，默认用户名密码为admin/password
 ```

### 启动Merge Service

```shell
# 下载merge service并解压 https://github.com/tagphi/dif-merge/blob/master/release/dif-merge-0.0.1.tar.gz
# 在解压出的dif-merge文件夹执行
./bin/start.sh
```

