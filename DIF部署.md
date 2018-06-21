此文档描述如何部署DIF。DIF是一个基于Hyperledger Fabric开发的虚假流量黑名单共识系统。系统共分为两个部分: Admin site和Client site。Admin site用来增加删除通道(Channel)的成员，增删peers地址，以及包含创建成员身份证书以及创建Fabric网络的脚本。Client负责向背书节点发起上传增量黑名单列表，上传移除列表，查看上传历史记录，下载某成员单次上传的列表，以及下载合并后列表的请求。

## 前置条件

```
yum install libtool-ltdl-devel
```



## 部署Admin Site

### 生成成员证书

* 根据需要修改 dif-admin/scripts/crypto-config.yaml

* 运行 dif-admin/scripts/generate-crypto-config.sh 生成成员证书，证书生成在dif-admin/crypto-config目录下

  ```shell
  cd dif-admin/scripts/
  ./generate-crypto-config.sh
  ```

### 生成通道创世区块

* 根据需要修改 dif-admin/scripts/configtx.yaml

* 运行 dif-admin/scripts/generate-channel-artifacts.sh生成创世区块，创世区块生成在dif-admin/channel-artifacts/ 目录下

  ```Shell
  cd dif-admin/scripts/
  ./generate-channel-artifacts.sh
  ```

### 启动configtxlator

```
configtxlator start
```

### 启动MongoDB

```
docker run --name dif-mongo -p 27017:27017 -d mongo:3.6.5-jessie
```

### 启动Order Peer Docker容器

* 运行 up-order.sh 启动order

  ```
  cd dif-admin/scripts/
  ./up-order.sh
  ```

### 创建通道

* 运行node create-network.js

  ```shell
  node create-network.js
  ```

### 实例化链码

* 确保背书节点都已经安装好链码的前提下，实例化链码

  ```Shell
  cd dif-admin/scripts/
  node instantiate-chaincode.js
  ```

### 启动Admin Site Web

```
cd dif-admin/app
node app.js
```



## 部署Client Site

### 安装node modules

* 在dif-client 目录下，运行npm install

### 修改配置

* 确保order tls证书在dif-client/crypto-config/order-tls目录下
* 确保本组织的证书在dif-client/crypto-config/peerOrganizations目录下
* 根据需要修改dif-client/config.json, dif-client/docker-compose-peer.yaml

### 加入通道

* scripts目录下，运行 node join-channel.js

  ```shell
  cd dif-client
  node join-channel.js
  ```

### 安装链码（仅背书节点）

* scripts目录下，运行 node install-chaincode.js

```shell
cd dif-client
node install-chaincode.js
```

### 启动Client Site Web

 ```Shell
cd dif-client/app
node app.js
 ```

