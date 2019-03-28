#!/bin/sh
current_dir=`pwd`
basedir=`cd $(dirname $0); pwd -P`
zip_file="${basedir}/dif_client.zip"

echo "清理不必要的目录和文件————>"
test $zip_file && rm $zip_file
rm -rf node_modules tmp ops package-lock.json mockups

cd "${basedir}/.."

zip -r -q dif_client.zip dif-client

mv dif_client.zip ${basedir}/dif_client.zip

cd $basedir

docker build -t rtbasia/dif-client .

docker rmi -f $(docker images | grep "^<none>" | grep -v "hours" | awk "{print $3}")

cd $current_dir