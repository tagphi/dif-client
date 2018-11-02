#!/bin/bash

######
# 倒计时
######
function countDown(){
    local seconds_left=$1

    echo "等待${seconds_left}秒……"
    while [ $seconds_left -gt 0 ];do
      echo -n $seconds_left
      sleep 1
      seconds_left=$(($seconds_left - 1))
      echo -ne "\r     \r" #清除本行文字
    done
}

######
# 启动 peer 节点和客户端
######
echo "启动peer节点————>" 
cd ~/dif-client
docker-compose -f docker-compose-peer.yaml up -d
countDown 5

echo "加入dif通道————>" 
node join-channel.js
countDown 5

echo "安装链码————>" 
node install-chaincode-manually.js

echo "启动ipfs容器————>" 
cd ~/dif-client/scripts/ipfs
. run.sh

# 启动app
cd ~/dif-client/app
forever start -o out.log -e err.log app.js &