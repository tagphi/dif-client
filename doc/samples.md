# DIF GIVT List使用示例

[TOC]

### 全局说明

- 每行为一条记录，行分隔符为`\n`
- 每列分隔符为tab键，即`\t`

### IPv4黑名单

##### 上传

**格式** - `ipv4地址	标志位`

- 标志位
	- 0 - 删除，即该ip不是黑名单
	- 1 - 增加，即该ip是黑名单

示例：

```
223.104.64.141	1
223.104.65.173	0
117.136.29.176	0
223.104.24.175	1
```

##### 申诉

**格式** - `ipv4`

示例：

```
223.104.64.14
223.104.65.173
117.136.29.176
223.104.24.175
```

##### 合并后名单

**格式** - `ipv4:投票的组织id...`

示例

```
1.119.10.254:HyLink,PUBLICISMEDIA
1.119.130.30:HyLink,PUBLICISMEDIA
1.119.131.92:Adsame,PUBLICISMEDIA
1.119.139.147:Adsame,PUBLICISMEDIA
1.119.140.242:Adsame,PUBLICISMEDIA
1.119.140.2:Adsame,PUBLICISMEDIA
```

### 设备ID黑名单

##### 上传

**格式** - `设备id	设备类型	加密方式	标志位`

- 设备类型	- 支持的设备类型有 `IMEI`、`IDFA`、`MAC`、`ANDROIDID`、`OTT_MAC`、`OAID`
- 加密方式	- 支持的加密方式有 `MD5`、`RAW`,允许上传原值或加密值
- 标志位	- 支持的标志位有 `1`、`0`,`1`代表新增,`0`代表移除

示例：

```
934FD049-5A6A-4C94-8F44-EBA8A957EC7C	IDFA	RAW	1
81A89E05-B2BC-430B-A482-BDBFDBC6D5F6	IDFA	RAW	0
8CEFFBB9-C26A-466E-A7DA-43F3BB61A5CD	IDFA	RAW	0
42E250BE-224A-41F7-BAF1-F08AB1CE0859	IDFA	RAW	1
99DAFF87-BD4B-4295-B5CB-27313093F0CF	IDFA	RAW	1
000958b5232b908401885a6286e5e1ad	IMEI	MD5	1
454f0565bba9e7ea2c142d213975666c	MAC	MD5	1
0976110a15f468bd8f29818292262bc0	ANDROIDID	MD5	1
ca7195d116bb0fe50b0fd3fe6d6cfad0	OTT_MAC	MD5	1
af1c93c5e6b84f12	OAID	RAW	1
```

##### 申诉

**格式** - `设备id	设备类型	加密方式`

- 设备类型	- 支持的设备类型有 `IMEI`、`IDFA`、`MAC`、`ANDROIDID`、`OTT_MAC`、`OAID`
- 加密方式	- 支持的加密方式有 `MD5`、`RAW`,允许申诉原值或加密值

示例：

```
934FD049-5A6A-4C94-8F44-EBA8A957EC7C	IDFA	RAW
81A89E05-B2BC-430B-A482-BDBFDBC6D5F6	IDFA	RAW
8CEFFBB9-C26A-466E-A7DA-43F3BB61A5CD	IDFA	RAW
42E250BE-224A-41F7-BAF1-F08AB1CE0859	IDFA	RAW
99DAFF87-BD4B-4295-B5CB-27313093F0CF	IDFA	RAW
000958b5232b908401885a6286e5e1ad	IMEI	MD5
454f0565bba9e7ea2c142d213975666c	MAC	MD5
0976110a15f468bd8f29818292262bc0	ANDROIDID	MD5
ca7195d116bb0fe50b0fd3fe6d6cfad0	OTT_MAC	MD5
af1c93c5e6b84f12	OAID	RAW
```

##### 合并后名单

**格式** - `设备id	设备类型	加密方式:投票的组织id...`

- 设备类型	- 支持的设备类型有 `IMEI`、`IDFA`、`MAC`、`ANDROIDID`、`OTT_MAC`、`OAID`
- 加密方式	- 支持的加密方式有 ~~`RAW`~~、`MD5`。
- **`特别说明：基于行业标准和相关法规要求，合并后名单只输出加密值。`**

示例

```
0b3daa4280b489c8c37907f2dd1954a5	IDFA	MD5:PUBLICISMEDIA,RTBAsia
0009c8c1b960c3254db681649abe67a8	IMEI	MD5:LDN,RTBAsia
96ec75e901cbf0f3be6352433ed50be7	IDFA	MD5:PUBLICISMEDIA,RTBAsia
001266b95c11c0b6de232092fb6dc35c	IMEI	MD5:Adsame,LDN
454f0565bba9e7ea2c142d213975666c	MAC	MD5:PUBLICISMEDIA,ctr
0976110a15f468bd8f29818292262bc0	ANDROIDID	MD5:LDN,ctr
ca7195d116bb0fe50b0fd3fe6d6cfad0	OTT_MAC	MD5:PUBLICISMEDIA,ctr
d225bc8e06ac954431b5243edb377348	OAID	RAW:RTBAsia,Adsame
```

### 设备ID灰名单

##### 上传

**格式** - `设备id	设备类型	标志位`

- 设备类型	- 支持的设备类型有 `IMEI`、`IDFA`、`MAC`、`ANDROIDID`、`OTT_MAC`、`OAID`
- 标志位	- 支持的标志位有 `1`、`0`。`1`代表新增,`0`代表移除
- **`特别说明：上传设备ID灰名单数据时即要上传数据的原值，也需要上传数据的MD5值。`**

示例：

```
1234567890	IDFA	1
1234567890987654321	IMEI	0
1234567890987654321	ANDROID	1
ac:de:48:00:11:22	MAC	0
ad:d1:48:01:12:02	OTT_MAC	0
af1c93c5e6b84f12	OAID	1
```

##### 申诉

**格式** - `设备id	设备类型`

- 设备类型	- 支持的设备类型有 `IMEI`、`IDFA`、`MAC`、`ANDROIDID`、`OTT_MAC`、`OAID`

示例

```
1234567890	IDFA
1234567890987654321	IMEI
1234567890987654321	ANDROID
ac:de:48:00:11:22	MAC
ad:d1:48:01:12:02	OTT_MAC
af1c93c5e6b84f12	OAID
```

##### 合并后名单

**格式** - `设备id	设备类型:投票的组织id...`

- 设备类型	- 支持的设备类型有 `IMEI`、`IDFA`、`MAC`、`ANDROIDID`、`OTT_MAC`、`OAID`
- **`特别说明1：合并后的设备ID灰名单，即包括原值，也包括MD5值。使用时可直接与流量中的设备ID（无论时RAW值或MD5值）进行匹配，无需再做加密。`**
- **`特别说明2：合并进入设备ID灰名单的设备ID，会自动从设备ID黑名单中移除。`**

示例

```
02:00:00:00:00:00	MAC:PUBLICISMEDIA,RTBAsia
d41d8cd98f00b204e9800998ecf8427e	OAID:LDN,RTBAsia
9f89c84a559f573636a47ff8daed0d33	IDFA:PUBLICISMEDIA,RTBAsia
00000000-0000-0000-0000-000000000000	IDFA:CAA,RTBAsia
00000000-0000-0000-0000-000000000000	OAID:CAA,RTBAsia
```

### 域名黑名单

##### 上传

**格式** - `域名	标志位`

示例：

```
peer0.test.com	1
peer0.test2.com	0
```

##### 申诉

**格式** - `域名`

示例：

```
peer0.test.com
peer0.test2.com
```

##### 合并后名单

**格式** - `域名:投票的组织id...`

示例

```
peer0.test.com:HyLink,PUBLICISMEDIA
peer0.test2.com:HyLink,PUBLICISMEDIA
```


### UA(已知爬虫/合规客户端)

##### 上传

**格式**  

```
规则1^A规则2...
名单示例
....
```

- **NOTE：** 其中分隔符^A为不可见字符  编码为"\001"

示例

```
p1:Mozilla/5.0^Ap1:Mozilla^Ap2:Baiduspider
Mozilla/5.0 (compatible; Baiduspider-render/2.0; +http://www.baidu.com/searc    h/spider.html)
p1:Mozilla/5.0^Ap2:Trident/5.0
Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0);
p2:360spider
360spider (http://webscan.360.cn)
```

##### 合并后规则名单

**格式** - `规则`

示例：

```
p2:360spider
```

### 媒体服务器IPv4

##### 上传

**格式** - `ipv4`

示例：

```
223.104.64.14
223.104.65.173
117.136.29.176
223.104.24.175
```

