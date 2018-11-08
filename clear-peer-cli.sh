#!/bin/bash

######
# 清空 peer cli 节点
######

echo "清理ipfs————>"
docker rm -f dif-ipfs
sudo rm -rf scripts/ipfs/data

echo "关闭app————>"
ps -efww|grep -w 'app.js'|grep -v grep|awk '{print $2}' | xargs kill -9

echo "清理dif容器和网络————>"
cd scripts/docker
. docker-utils.sh
cd ../..

