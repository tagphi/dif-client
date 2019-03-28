#!/bin/bash

######
# 清空 peer cli 节点
######
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


echo "清理ipfs————>"
docker rm -f  `docker ps -a | grep ipfs | cut -c 1-10`
sudo rm -rf scripts/ipfs/data

echo "关闭app————>"
ps -efww|grep -w 'app.js'|grep -v grep|awk '{print $2}' | xargs kill -9

echo "清理dif容器和网络————>"
cd scripts/docker
bash docker-utils.sh
countDown 5
cd ../..

