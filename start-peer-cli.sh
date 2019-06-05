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

echo "启动容器————>"
docker-compose -f docker-compose-peer.yaml up -d

countDown 15

echo "加入difchannel通道————>"
docker exec dif-client node /home/dif/dif-client/join-channel.js
countDown 5

echo "安装链码————>"
docker exec dif-client node /home/dif/dif-client/install-chaincode-manually.js