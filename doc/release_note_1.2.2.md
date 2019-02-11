# Release Note 1.2.2

>### notes

- 版本：14 -> 15
- SCHEMA_VER = 'V11_'
- const QUORUM = 15.0 // 法定票数
- "forever": "0.15.3"

## 功能更新

- 使用链码**`Discover自动发现机制`**优化链码的调用与查询；
- 增加冻结期的自动锁定和禁止上传新名单功能；
- 增加观察者角色；

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
