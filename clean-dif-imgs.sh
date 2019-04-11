#!/usr/bin/env bash

docker images | grep "dif-client"| awk '{print $3}' | xargs docker rmi -f