FROM dockerhub.rtbasia.com/dif/dif-client-base


WORKDIR /home/dif

USER dif

# 拷贝源码
RUN mkdir dif-client
COPY ./  /home/dif/dif-client

# 将base中的依赖目录移动到指定新工程的对应位置
RUN mv /home/dif/node_modules /home/dif/dif-client/node_modules

USER root
RUN chown -R dif:dif .

USER dif
WORKDIR /home/dif/dif-client
RUN npm install

VOLUME /home/dif/dif-client/crypto-config/peerOrganizations/

EXPOSE 8081