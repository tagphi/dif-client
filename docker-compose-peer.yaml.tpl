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