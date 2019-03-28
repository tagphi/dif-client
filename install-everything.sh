#!/bin/bash

echo "安装依赖————>"
npm install

echo "生成配置————>"
node install-everything.js $1