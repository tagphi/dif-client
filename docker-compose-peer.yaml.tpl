# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

version: '2'

volumes:
  %peerHost%:

networks:
  dif:

services:
  %peerHost%:
    container_name: %peerHost%
    extends:
      file: base/peer-base.yaml
      service: peer-base
    environment:
      - CORE_PEER_ID=%peerHost%
      - CORE_PEER_ADDRESS=%peerHost%:7051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=%peerHost%:7051
      - CORE_PEER_LOCALMSPID=%mspId%
      - CORE_CHAINCODE_STARTUPTIMEOUT=1800s
    volumes:
        - /var/run/:/host/var/run/
        - ./%mspDir%:/etc/hyperledger/fabric/msp
        - ./%tlsDir%:/etc/hyperledger/fabric/tls
        - %peerHost%:/var/hyperledger/production
    ports:
      - 7051:7051
      - 7053:7053
    networks:
      - dif

  dif-ipfs:
    container_name: dif-ipfs
    image: dockerhub.rtbasia.com/dif/dif-ipfs:latest
    networks:
      - dif
    volumes:
      - ./swarm.key:/opt/ipfs/swarm.key

  dif-merge:
    container_name: dif-merge
    image: dockerhub.rtbasia.com/dif/dif-merge:latest
    mem_limit: 5120M
    networks:
      - dif
    depends_on:
      - dif-ipfs
    command: /opt/wait-for-it.sh dif-ipfs:5001 -- /opt/dif-merge/bin/start.sh
    #command: tail -f /dev/null

  dif-client:
    image: dockerhub.rtbasia.com/dif/dif-client:latest
    container_name: dif-client
    networks:
      - dif
    command: sh /home/dif/dif-client/start.sh # 延迟启动等待网络创建
    ports:
      - 8081:8081
    volumes:
      - ./crypto-config/order-tls:/home/dif/dif-client/crypto-config/order-tls
      - ./crypto-config/peerOrganizations/%org_domain%:/home/dif/dif-client/crypto-config/peerOrganizations/%org_domain%
      - ./config.json:/home/dif/dif-client/config.json