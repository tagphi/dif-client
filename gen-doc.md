## MSP配置和生成文档

###概要
    
&emsp;&emsp;MSP,即Member Service Provider(成员服务提供者)，是一个提供抽象化成员操作框架的组件，
MSP将颁发与校验证书，以及用户认证背后的所有密码学机制与协议都抽象了出来，
一个MSP可以自己定义身份，以及身份的管理（身份验证）与认证（生成与验证签名）规则。<br/>
&emsp;&emsp;初始化一个组织MSP实例的核心，就是根据组织的成员拓扑结构去生成不同实体的证书以及相应的密钥。通常每个组织都有一个唯一的
CA进行证书颁发和管理，并指定唯一的根证书（RootCA）作为证书链的起始证书。
为简化组织的所有实体的加密材料的生成，特提供友好的一键生成的脚本，下面是详细的配置和使用步骤

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

&emsp;&emsp;因为不可描述的原因，golang的很多依赖包都很难直接下载到，如果没有VPN的化，
可以使用工具gopm实现依赖的下载和管理

        > 下载和安装 gopm
            go get -u github.com/gpmgo/gopm
        > 下载 goimports
            gopm get -g -d golang.org/x/tools/cmd/goimports
        > 安装 goimports
            go install golang.org/x/tools/cmd/goimports
            

> 02、cryptogen：fabric的组织结构加密材料生成工具

&emsp;&emsp;cryptogen是fabric官方提供的快速生成加密材料的辅助工具，可以根据指定组织的拓扑结构配置文件所有实体的证书和秘钥，非常方便

- 下载fabric源码

        git clone https://github.com/hyperledger/fabric.git
        
- 进入fabric目录

        cd $GOPATH/src/github.com/hyperledger/fabric


###使用步骤

    

    