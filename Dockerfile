FROM centos:7

RUN yum install -y git
RUN yum install -y wget
RUN yum install -y unzip
RUN yum install -y make
RUN yum install -y gcc-c++
RUN yum install -y vim

RUN useradd -ms /bin/bash dif

USER dif

WORKDIR /home/dif

COPY dif_client.zip /home/dif/

RUN unzip dif_client.zip && \
    wget https://nodejs.org/dist/latest-v8.x/node-v8.15.1-linux-x64.tar.gz && \
    tar xvf node-v8.15.1-linux-x64.tar.gz

USER root

RUN ln -s /home/dif/node-v8.15.1-linux-x64/bin/node /usr/bin/node && \
    ln -s /home/dif/node-v8.15.1-linux-x64/bin/npm /usr/bin/npm

RUN npm install forever -g

RUN ln -s /home/dif/node-v8.15.1-linux-x64/bin/forever /usr/bin/forever

USER dif

WORKDIR /home/dif/dif-client

VOLUME /home/dif/dif-client/crypto-config/peerOrganizations/

RUN npm install

EXPOSE 8081