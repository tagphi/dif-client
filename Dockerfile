FROM dockerhub.rtbasia.com/dif/dif-client-base

USER dif

COPY dif_client.zip /home/dif/

WORKDIR /home/dif
RUN unzip -o dif_client.zip

WORKDIR /home/dif/dif-client
RUN npm install

VOLUME /home/dif/dif-client/crypto-config/peerOrganizations/

EXPOSE 8081