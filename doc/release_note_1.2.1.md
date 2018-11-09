# Release Note 1.2.1

## 修复问题

- 修复了网络速度不好时在上次合并未完成时启动新合并的问题
- 修复了Discovery无法取得所有peer地址的问题
- 修复了链码中使用了时间戳导致的背书可能失败的问题
- 原来各组织上传的测试数据太多，清理了数据，以后请用真实数据上传



## 升级部署

* 停掉peer容器并清空volume(非常重要！)

  ```shell
  docker-compose -f docker-compose-peer.yaml down --volumes
  ```

* 从Github上pull最新的代码。

* 生成配置，安装node modules。（请将下面命令中的MSPID替换为各自成员的mspid）

  ```shell
  ./install-everything.sh MSPID
  ```

* 启动peer

  ```shell
  docker-compose -f docker-compose-peer.yaml up -d
  ```

* 加入网络

  ```shell
  node join-channel.js
  ```

* 重启app.js

  * 杀掉原来的app.js进程。用forever重启app.js

