#!/bin/sh

if [ $# != 1 ]; then
    echo "Usage:./build_cli.sh version"
    exit 1
fi

version=$1

echo "building version:$version————>"
docker build -t rtbasia/dif-client:$version .

echo "release version:$version-->"
docker tag rtbasia/dif-client:$version dockerhub.rtbasia.com/dif/dif-client:$version
docker push dockerhub.rtbasia.com/dif/dif-client:$version

echo "tag latest————>"
docker tag dockerhub.rtbasia.com/dif/dif-client:$version dockerhub.rtbasia.com/dif/dif-client:latest
docker push dockerhub.rtbasia.com/dif/dif-client:latest

echo "remove tmp images————>"
docker images | grep "<none>"| awk '{print $3}' | xargs docker rmi -f