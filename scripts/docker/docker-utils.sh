#!/bin/bash

######
# docker 工具类型
######

# 移除所有hyperledger容器
function docker_utils_rm_ctns(){
	local containerIds=$(docker ps -a | grep -E "hyper|dev" | cut -c 1-10)
	if [ "$containerIds" != "" ]; then
		docker rm -f ${containerIds}
	fi
}

# 移除依赖的镜像
function docker_rmi_child_images(){
	childImages=`docker image inspect --format='{{.Id}}' $(docker image ls -q --filter since=b023f9be0771)`
	docker rmi -f ${childImages}
}

# 清理所有
function docker-utils-clear(){
	echo "————>" '清空所有容器'
	docker_utils_rm_ctns

	echo "————>" '清理无效容器券'
	./docker-utils-prune-volume.sh

	echo "————>" '清理无效网络'
	./docker-utils-prune-net.sh
}

docker-utils-clear
