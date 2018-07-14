## 证书配置和生成文档

###概要

MSP，即Member Service Provider(成员服务提供者)，是一个提供抽象化成员操作框架的组件，MSP将颁发与校验证书，以及用户认证背后的所有密码学机制与协议都抽象了出来，一个MSP可以自己定义身份，以及身份的管理（身份验证）与认证（生成与验证签名）规则。

初始化一个组织MSP实例，就是根据组织的成员拓扑结构去生成不同实体的证书以及相应的密钥。通常每个组织都有一个唯一的CA进行证书颁发和管理，并指定唯一的根证书（RootCA）作为证书链的起始证书。

为简化证书的生成，以下部分说明如何使用Fabric的cryptogen工具来生成组织证书。

###依赖环境

> 01、golang：语言环境

Hyperledger Fabric主要以golang实现，所以go语言的开发环境是所有后续操作和运行的前提，必须首先安装golang，并配置好环境变量

- 安装必要的开发组件

        yum install  gcc libtool libtool-ltdl-devel openssl

- 下载

        wget -c https://storage.googleapis.com/golang/go1.8.3.linux-amd64.tar.gz

- 解压
          
        tar -C /usr/local/ -zxvf go1.8.3.linux-amd64.tar.gz

- 设置GOROOT：golang安装目录

        > 打开环境配置文件
            sudo vim /etc/profile.d/go.sh
        > 输入内容
            export PATH=$PATH:/usr/local/go/bin
        > 保存退出
            :wq!
        > 立即生效
            source /etc/profile.d/go.sh

- 设置GOPATH：golang的主要开发和编译环境

        > 创建工作目录
            mkdir -p ~/dev/go
        > 打开配置文件
            sudo vim /etc/profile.d/gopath.sh
        > 输入内容
            export GOPATH=/root/dev/go
        > 保存退出
            :wq!
        > 立即生效
            source /etc/profile.d/gopath.sh

- 打印安装的版本

    go version

- 科学上网

因为不可描述的原因，golang的很多依赖包都很难直接下载到，如果没有VPN的化，可以使用工具gopm实现依赖的下载和管理

        > 下载和安装 gopm
            go get -u github.com/gpmgo/gopm
        > 下载 goimports
            gopm get -g -d golang.org/x/tools/cmd/goimports
        > 安装 goimports
            go install golang.org/x/tools/cmd/goimports


> 02、cryptogen：fabric的组织结构加密材料生成工具

cryptogen是fabric官方提供的快速生成加密材料的辅助工具，可以根据指定组织的拓扑结构配置文件所有实体的证书和秘钥，非常方便

- 下载fabric源码

        git clone https://github.com/hyperledger/fabric.git
    
- 进入fabric目录

        cd $GOPATH/src/github.com/hyperledger/fabric

- 编译证书生成工具 cryptogen

		make cryptogen

###使用步骤

> 01、编辑组织拓扑结构配置文件

该配置文件主要配置组织的内部的成员和用户结构，证书生成工具cryptogen会根据该文件自动生成各实体的证书和密钥。

- 创建配置文件cryptogen.yaml

	touch cryptogen.yaml

- 编辑

		PeerOrgs:
		  #  公司或是组织名
		  - Name: Org1
		    # 域名
		    Domain: org1.example.com
		    # peer节点的数量
		    Template:
		      Count: 2
		    # 用户数量
		    Users:
		      Count: 1
   
- 生成证书和密钥

		cryptogen generate --config=./cryptogen.yaml
	
- 查看输出

默认的生成的证书文件在当前目录的crypto-config目录下，目录结构类似如下

	crypto-config
	└── peerOrganizations
	    └── org1.example.com
	        ├── ca
	        │   ├── 7c504493623d35b8fb2e510a48995fb32ece665d1eb46c080c555715de935507_sk
	        │   └── ca.org1.example.com-cert.pem
	        ├── msp
	        │   ├── admincerts
	        │   │   └── Admin@org1.example.com-cert.pem
	        │   ├── cacerts
	        │   │   └── ca.org1.example.com-cert.pem
	        │   ├── config.yaml
	        │   └── tlscacerts
	        │       └── tlsca.org1.example.com-cert.pem
	        ├── peers
	        │   ├── peer0.org1.example.com
	        │   │   ├── msp
	        │   │   │   ├── admincerts
	        │   │   │   │   └── Admin@org1.example.com-cert.pem
	        │   │   │   ├── cacerts
	        │   │   │   │   └── ca.org1.example.com-cert.pem
	        │   │   │   ├── config.yaml
	        │   │   │   ├── keystore
	        │   │   │   │   └── 31f9a11f5fe4e40053f8615b1a040a7d66ea00f10e59ce9f17373956e257156e_sk
	        │   │   │   ├── signcerts
	        │   │   │   │   └── peer0.org1.example.com-cert.pem
	        │   │   │   └── tlscacerts
	        │   │   │       └── tlsca.org1.example.com-cert.pem
	        │   │   └── tls
	        │   │       ├── ca.crt
	        │   │       ├── server.crt
	        │   │       └── server.key
	        │   └── peer1.org1.example.com
	        │       ├── msp
	        │       │   ├── admincerts
	        │       │   │   └── Admin@org1.example.com-cert.pem
	        │       │   ├── cacerts
	        │       │   │   └── ca.org1.example.com-cert.pem
	        │       │   ├── config.yaml
	        │       │   ├── keystore
	        │       │   │   └── 502abe8f54612f44293741618467aa16b6817f74692b8e22b829d60bec7a2bac_sk
	        │       │   ├── signcerts
	        │       │   │   └── peer1.org1.example.com-cert.pem
	        │       │   └── tlscacerts
	        │       │       └── tlsca.org1.example.com-cert.pem
	        │       └── tls
	        │           ├── ca.crt
	        │           ├── server.crt
	        │           └── server.key
	        ├── tlsca
	        │   ├── a8b32330a2ba0c0ddf95d227baa5c2c9a354ec9c03bb9a51bbdc47a2ca8306ae_sk
	        │   └── tlsca.org1.example.com-cert.pem
	        └── users
	            ├── Admin@org1.example.com
	            │   ├── msp
	            │   │   ├── admincerts
	            │   │   │   └── Admin@org1.example.com-cert.pem
	            │   │   ├── cacerts
	            │   │   │   └── ca.org1.example.com-cert.pem
	            │   │   ├── keystore
	            │   │   │   └── 6090a215e337076795e7a1bdc39239a78f7e2485adf3745633c86441d4c9167d_sk
	            │   │   ├── signcerts
	            │   │   │   └── Admin@org1.example.com-cert.pem
	            │   │   └── tlscacerts
	            │   │       └── tlsca.org1.example.com-cert.pem
	            │   └── tls
	            │       ├── ca.crt
	            │       ├── client.crt
	            │       └── client.key
	            └── User1@org1.example.com
	                ├── msp
	                │   ├── admincerts
	                │   │   └── User1@org1.example.com-cert.pem
	                │   ├── cacerts
	                │   │   └── ca.org1.example.com-cert.pem
	                │   ├── keystore
	                │   │   └── b10ad25c6f0b61e770fb97da89f4abda01aa76c112e222b3cdca99efab2f3d4b_sk
	                │   ├── signcerts
	                │   │   └── User1@org1.example.com-cert.pem
	                │   └── tlscacerts
	                │       └── tlsca.org1.example.com-cert.pem
	                └── tls
	                    ├── ca.crt
	                    ├── client.crt
	                    └── client.key

​    