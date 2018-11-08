#!/usr/bin/expect -f

# 清理容器券
spawn docker volume prune

expect "y/N"
send "y\n"

interact