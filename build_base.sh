#!/bin/sh


docker build -f cli-base.df -t rtbasia/dif-client-base .

docker tag rtbasia/dif-client-base:latest dockerhub.rtbasia.com/dif/dif-client-base:latest

#docker push dockerhub.rtbasia.com/dif/dif-client-base:latest

docker images | grep "^<none>"| awk '{print $3}' | xargs docker rmi -f


cd $current_dir