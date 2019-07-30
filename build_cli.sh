#!/bin/sh

docker build -t rtbasia/dif-client .

docker tag rtbasia/dif-client:latest dockerhub.rtbasia.com/dif/dif-client:latest

docker push dockerhub.rtbasia.com/dif/dif-client:latest

docker images | grep "<none>"| awk '{print $3}' | xargs docker rmi -f