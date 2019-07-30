FROM dockerhub.rtbasia.com/dif/dif-client-base


WORKDIR /home/dif

USER dif

RUN mkdir dif-client
COPY ./  /home/dif/dif-client
RUN mv /home/dif/node_modules /home/dif/dif-client/node_modules

USER root
RUN chown -R dif:dif .

USER dif
WORKDIR /home/dif/dif-client
RUN npm install

VOLUME /home/dif/dif-client/crypto-config/peerOrganizations/

EXPOSE 8081