# Release Note 1.2.1

## 修复问题

- 增加了一个额外的merge service来处理合并任务
- 增加任务追踪页面查看合并任务的状态
- 修复了Discovery无法取得所有peer地址的问题
- 修复了链码中使用了时间戳导致的背书可能失败的问题
- 移除了媒体IP必须存在于IP黑名单中的限制。移除了媒体IP只能上传1000条的限制。改增量上传为全量上传。
- 机器要求由原来的4G内存调整为8G内存
- 清除了原来链里的数据，重建了链
  - 原因一是因为原来很多成员上传的都是测试数据
  - 原因二是Fabric 1.3范围查询api不允许使用组合键，但是旧数据使用的是组合键。因为大部分都是测试数据，做数据迁移也就没必要了



## 升级部署

* 停掉peer容器并清空volume(非常重要！)

  ```shell
  docker-compose -f docker-compose-peer.yaml down --volumes
  ```

* 从Github上pull最新的代码

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

* 启动Merge Service

  ```shell
  # 下载Merge Service并解压 https://github.com/tagphi/dif-merge/blob/master/release/dif-merge-0.0.1.tar.gz
  # 在解压出的dif-merge文件夹执行
  ./bin/start.sh
  ```

