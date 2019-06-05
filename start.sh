#!/bin/sh
basedir=`cd $(dirname $0); pwd -P`

cd "${basedir}/app" && forever app.js