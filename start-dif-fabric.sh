#!/usr/bin/env bash

######
# 启动并加入dif黑名单区块链主网络
######

# 组织域名
msp_id=$1
org_domain=$2

function print_usage(){
    if [ $# != 2 ] ; then
        echo -e 'Bad Params!!
Usage:  ./start-dif-fabric.sh msp_id org_domain
arg:
    - msp_id    the msp id of org,eg:GHHjkK
    - org_domain    the domain of org,eg:rtbasia.com'

        exit 1
    fi
}

#

# 检查文件
function check_files(){
    org_pems_dir=crypto-config/peerOrganizations/${org_domain}
    peer_pems_dir=${org_pems_dir}/peers/peer0.${org_domain}

    swarm_key_file='swarm.key'

    if [ ! -d ${org_pems_dir} -o ! -d ${peer_pems_dir} ]; then
        echo -e '\n no pems of org \n'
    fi

    if [ ! -f ${swarm_key_file} ]; then
        echo -e '\n the swarm.key for dif-ipfs is lost!please contact the developer or marketer for it \n'
    fi

}

print_usage $*

echo "———— check files ————"
check_files

echo "———— clean old ————"
rm  config.json docker-compose-peer.yaml

echo "———— generate config ————"
./install-everything.sh ${msp_id}

