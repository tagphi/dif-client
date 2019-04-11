#!/usr/bin/env bash

######
# 发布release包
######

echo '===================='
echo '----发布release包----'
echo '===================='

rel_version=$1

if [ ! ${rel_version} ]; then
    echo -e './release.sh: no target release version
    Usage:./release.sh version eg:v1.0.0'
    exit 1
fi

release_dir=./release/dif-client-${rel_version}
release_path=${release_dir}.tar.gz

echo "clean old pkg————>"
rm -fr ${release_dir}
rm -fr ${release_path}

echo "pack new version ————>"
mkdir -p ${release_dir}/crypto-config/order-tls
mkdir -p ${release_dir}/crypto-config/peerOrganizations

cp ./.env ${release_dir}
cp ./swarm.key ${release_dir}
cp ./generate_config.sh ${release_dir}
touch ${release_dir}/msp_id.conf

cp ./config.json.tpl ${release_dir}
cp ./docker-compose-peer.yaml.tpl ${release_dir}
cp ./clear-peer-cli.sh ${release_dir}
cp ./start-peer-cli.sh ${release_dir}

cp -R base ${release_dir}/
cp -R crypto-config/order-tls ${release_dir}/crypto-config

cp ./doc/release_note_${rel_version}.md ${release_dir}

cd release
tar -czvf dif-client-${rel_version}.tar.gz dif-client-${rel_version}
cd ..

echo "clean tmp files————>"
rm -rf ${release_dir}


