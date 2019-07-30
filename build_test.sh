#!/bin/sh

docker build -t rtbasia/dif-client-test .

docker tag rtbasia/dif-client-test:latest dockerhub.rtbasia.com/dif/dif-client-test:latest

docker push dockerhub.rtbasia.com/dif/dif-client-test:latest

docker images | grep "<none>"| awk '{print $3}' | xargs docker rmi -f
