#!/bin/bash

######
# 清空 客户端 节点
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

echo "清理临时文件————>"
rm -rf /tmp/dif-kvs/

echo "清理容器————>"
docker-compose -f docker-compose-peer.yaml down --volumes
docker ps -a | grep -v 'CONTAINER' |awk '{print $1}' | xargs -r docker rm -fv

echo "关闭app————>"
ps -efww |grep -w 'app.js' |grep -v grep |awk '{print $2}' | xargs -r kill -9
