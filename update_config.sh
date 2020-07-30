#!/usr/bin/env bash
msp_id=`cat msp_id.conf`

if [ -z "$msp_id" ]; then
   echo "请在msp_id.conf中配置MSPID"
   exit 1
fi

current_dir=`pwd`
base_dir=`cd $(dirname $0); pwd -P`

echo "检查证书...."

credential_dir="${base_dir}/crypto-config/peerOrganizations"

org_domain=`ls ${credential_dir} | head -n 1`
peer_host=`ls ${credential_dir}/${org_domain}/peers | head -n 1`

if [ ! -f 'swarm.key' ]; then
    echo -e 'error: lack of swarm.key!
    please contact our marketer or developer for it'
    exit 1
fi

if [ -z "$org_domain" ]; then
    echo "证书不存在, 需要把证书放入crypto-config/peerOrganizations"
    exit 1
fi

if [ -z "$peer_host" ]; then
    echo "Peers证书不存在, 你的证书可能不完整"
    exit 1
fi

echo "生成配置 ..."

prvKeyPath="crypto-config/peerOrganizations/${org_domain}/peers/${peer_host}/msp/keystore"
sgnCertPath="crypto-config/peerOrganizations/${org_domain}/peers/${peer_host}/msp/signcerts"
adminKeyPath="crypto-config/peerOrganizations/${org_domain}/users/Admin@${org_domain}/msp/keystore"
adminCertPath="crypto-config/peerOrganizations/${org_domain}/users/Admin@${org_domain}/msp/signcerts"
tlsCertPath="crypto-config/peerOrganizations/${org_domain}/msp/tlscacerts/tlsca.${org_domain}-cert.pem"
eventUrl="grpc://${peer_host}:7053"
sslTargetNameOverride=$peer_host
mspDir="crypto-config/peerOrganizations/${org_domain}/peers/${peer_host}/msp"
tlsDir="crypto-config/peerOrganizations/${org_domain}/peers/${peer_host}/tls"

declare -a tokens=("org_domain" ${org_domain} "prvKeyPath" $prvKeyPath "sgnCertPath" $sgnCertPath "adminKeyPath" $adminKeyPath "adminCertPath" $adminCertPath "tlsCertPath" $tlsCertPath "eventUrl" $eventUrl "sslTargetNameOverride" $sslTargetNameOverride "mspDir" $mspDir "tlsDir" $tlsDir "peerHost" $peer_host "mspId" $msp_id)

function searchNReplace() {
    file_name=$1
    content=`cat $file_name`

    length=${#tokens[@]}

    for (( i=0; i<${length}; i=i+2 ));
    do
      target="%${tokens[$i]}%"
      replace=${tokens[$i+1]}

      content="${content//${target}/${replace}}"
    done

    echo "$content" > "${file_name//.tpl/}"
}

searchNReplace "${base_dir}/config.json.tpl"

echo "搞定！"