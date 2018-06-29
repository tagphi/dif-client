此文档描述如何部署DIF。DIF是一个基于Hyperledger Fabric开发的虚假流量黑名单共识系统。系统共分为两个部分: Admin site和Client site。Admin site用来增加删除通道(Channel)的成员，增删peers地址，以及包含创建成员身份证书以及创建Fabric网络的脚本。Client负责向背书节点发起上传增量黑名单列表，上传移除列表，查看上传历史记录，下载某成员单次上传的列表，以及下载合并后列表的请求。

## 前置条件

```
1. docker-compose version > 1.20.1
2. Docker version > 18.03.0
3. Node version > 8.11
4. npm version > 5.6.0
3. go version > 1.10.3 (仅Admin节点)
4. 开放端口7050-7053和80
```



## 部署Admin Site

### 安装configtxlator

* 创建目录 /usr/local/go/src/github.com/hyperledger/

* 下载或者checkout fabric 代码到/usr/local/go/src/github.com/hyperledger/ 下

* 编译configtxlator

  ```shell
  cd /usr/local/go/src/github.com/hyperledger/fabric
  make configtxlator
  ```

* 如果编译过程因为缺少ltdl而报错，则需要安装ltdl

  ```shell
  yum install libtool-ltdl-devel
  ```

* 拷贝生成的configtxlator到path

  ```shell
  sudo mv build/bin/configtxlator /usr/bin/
  ```

### 生成成员证书

我们为RTBAsia创建成员证书作为Fabric网络的初始成员

* 根据需要修改 dif-admin/scripts/crypto-config.yaml

* 运行 dif-admin/scripts/generate-crypto-config.sh 生成成员证书，证书生成在dif-admin/crypto-config目录下

  ```shell
  # 在 dif-admin/scripts/ 目录下运行
  ./generate-crypto-config.sh
  ```

### 生成通道创世区块

* 根据需要修改 dif-admin/scripts/configtx.yaml

* 运行 dif-admin/scripts/generate-channel-artifacts.sh生成创世区块，创世区块生成在dif-admin/channel-artifacts/ 目录下

  ```Shell
  # 在 dif-admin/scripts/ 目录下运行
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

  ```shell
  # 在 dif-admin/scripts/ 目录下运行
  ./up-order.sh
  ```

### 创建通道

* 运行node create-network.js

  ```shell
  # 在 dif-admin/scripts/ 目录下运行
  node create-network.js
  ```

### 实例化链码

* 确保背书节点都已经安装好链码的前提下，实例化链码

  ```Shell
  # 在 dif-admin/scripts/ 目录下运行
  node instantiate-chaincode.js
  ```

### 安装Admin Site需要的node modules和js

```shell
# 安装bower
sudo npm install -g bower

# 在 dif-admin 目录下运行
npm install

# 在 dif-admin/public/static 目录下运行
bower install
```

### 启动Admin Site Web

```shell
# 在 dif-admin/app 目录下运行
node app.js
```



## 部署Client Site

### 拷贝组织证书到dif-client/crypto-config/ 目录下

### 修改配置

* 确保order tls证书在dif-client/crypto-config/order-tls目录下
* 确保本组织的证书在dif-client/crypto-config/peerOrganizations目录下

### 安装依赖和生成配置

```shell
# 在 dif-client 目录下运行
node install-everything.js [MSPID]
```

### 加入通道

```shell
# 在 dif-client 目录下运行
node join-channel.js
```
### 安装链码（仅背书节点）

```shell
# 在 dif-client 目录下运行
node install-chaincode.js
```

### 启动Client Site Web

 ```Shell
# 在 dif-client/app 目录下运行
node app.js
 ```

