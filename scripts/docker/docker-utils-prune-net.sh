#!/usr/bin/expect -f

# 清理网络
spawn docker network prune

expect "y/N"
send "y\n"

interact