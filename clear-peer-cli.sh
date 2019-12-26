#!/bin/bash

######
# 清空 客户端 节点
######

echo "清理client节点————>"
docker-compose -f docker-compose-peer.yaml down --volumes
docker ps -a | grep -v 'CONTAINER' |awk '{print $1}' | xargs -r docker rm -fv

docker images | grep dev-peer0 | xargs docker rmi -f
sleep 5

docker volume prune -f
docker network prune -f