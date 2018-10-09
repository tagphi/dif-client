# Release Note 1.2

## 新功能

* 申诉流程。所有成员都能提起对黑名单中条目的申诉，申诉在4/9成员同意后会在本年度生效。合并结果中会剔除有效申诉中的记录。
* 媒体服务器ip。媒体成员可以上传加速出口，server to server监测的ip。每次只能提交1000条记录，并且记录必须存在于最新的ip合并列表中。媒体服务器ip会在最终合并结果中被剔除。
* 下载除动态ip的黑名单。提供额外一个剔除掉3G/4G网络ip的黑名单供下载。
* 合并历史。合并历史页面可以查看历史合并版本。



## 优化

* 部署高可用的order集群。包括2台order和zookeeper，kafka集群。
* 部署新的IPFS节点，加大上传带宽。
* 升级到Fabric 1.2版本。
* 优化合并代码。
* 修复了链码升级后总版本号归0的问题。
* 加长了从ipfs上传下载超时的时间。上传到RTBAsia部署的节点，下载从local的ipfs下载。将超时时间写入配置。



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

* 连接到新的ipfs节点, 确保ipfs容器运行的情况下

  ```
  sudo docker exec -it ipfs /bin/sh
  $ ipfs bootstrap rm --all
  $ ipfs bootstrap add /ip4/175.6.228.227/tcp/4001/ipfs/QmUenufadCQxQbkJ2aCfGRpJSPgBwNNxKsfFGPxNSAcDmh
  ```




## FAQ

* 如果能上传不能下载，应该是本地ipfs没有启动成功。请检查ipfs容器是否正确启动了。
* 如果下载超时，可能是节点服务器带宽太小。可以提高带宽或者修改配置文件中文件下载超时设置。
* 任何其他问题请联系Craig。