# Release Note 1.2.2

## 功能更新

- 使用链码**`Discover service`**优化链码的调用与查询，背书和查询节点由peer的gossip自动发现
- 增加冻结期的自动锁定和禁止上传新名单功能。每月10日1时到20日1时为冻结期，冻结期结束后会产生一个正式版本，历史正式版本可以在合并历史中查看
- 增加观察者角色，观察者节点不能上传数据到链。但是能查询链中数据

## 升级部署

- 拉取最新代码

```
git pull
```

- 重新安装所有依赖和配置

```
./install-everything.sh [mspId]
```

- 停止运行中的**`app.js`**

```
ps -efww | grep -v grep \
	| grep 'dif-client' \
	| grep -w 'app.js' \
	| awk '{print $2}' \
	| xargs kill -9
```

- 重启 **`app.js`**

```
cd app
forever start -o out.log -e err.log app.js &
```
