# Dif黑名单使用示例

## 目录
- [全局说明](#全局说明)
- [上传/申诉](#上传申诉)
    - [ip](#ip)
        - [黑名单](#黑名单)
        - [申诉](#申诉)
        - [白名单（媒体IP）](#白名单媒体ip)
    - [device](#device)
        - [黑名单](#黑名单)
        - [申诉](#申诉)
    - [默认设备（设备白名单）](#默认设备设备白名单)
        - [黑名单](#黑名单)
        - [申诉](#申诉)
    - [域名Domain](#域名domain)
        - [黑名单](#黑名单)
        - [申诉](#申诉)
- [下载](#下载)
    - [ip](#ip)
    - [device](#device)
    - [domain](#domain)

## 全局说明

- 每行为一条记录，行分隔符为`\n`
- 每列分隔符为tab键，即`\t`

## 上传/申诉

### ip

##### 黑名单

**格式** - `ip	标志位`

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

**格式** - `ip`

示例：

```
223.104.64.14
223.104.65.173
117.136.29.176
223.104.24.175
```

##### 白名单（媒体IP）

**格式** - `ip`

示例：

```
223.104.64.14
223.104.65.173
117.136.29.176
223.104.24.175
```

### device

##### 黑名单

**格式** - `设备id	设备类型	加密方式	标志位`

- 设备类型 - 支持的设备类型有 `IMEI`、`IDFA`、`MAC`、`ANDROIDID`
- 加密方式	- 支持的加密方式有 `MD5`、`RAW`

示例：

```
934FD049-5A6A-4C94-8F44-EBA8A957EC7C	IDFA	RAW	1
81A89E05-B2BC-430B-A482-BDBFDBC6D5F6	IDFA	RAW	0
8CEFFBB9-C26A-466E-A7DA-43F3BB61A5CD	IDFA	RAW	0
42E250BE-224A-41F7-BAF1-F08AB1CE0859	IDFA	RAW	1
99DAFF87-BD4B-4295-B5CB-27313093F0CF	IDFA	RAW	1
```

##### 申诉

**格式** - `设备id	设备类型	加密方式`

示例：

```
934FD049-5A6A-4C94-8F44-EBA8A957EC7C	IDFA	RAW
81A89E05-B2BC-430B-A482-BDBFDBC6D5F6	IDFA	RAW
8CEFFBB9-C26A-466E-A7DA-43F3BB61A5CD	IDFA	RAW
42E250BE-224A-41F7-BAF1-F08AB1CE0859	IDFA	RAW
99DAFF87-BD4B-4295-B5CB-27313093F0CF	IDFA	RAW
```

### 默认设备（设备白名单）

即程序生成的非标准格式的设备id

##### 黑名单

**格式** - `设备id	设备类型	标志位`

示例：

```
1234567890	IDFA	1
1234567890987654321	IMEI	0
1234567890987654321	ANDROID	1
1234567890987654321	MAC	0
```

##### 申诉

**格式** - `设备id	设备类型`

示例

```
1234567890	IDFA
1234567890987654321	IMEI
1234567890987654321	ANDROID
1234567890987654321	MAC
```


### 域名Domain

##### 黑名单

**格式** - `域名	标志位`

示例：

```
peer0.rtbasia.com	1
peer0.rtbasia2.com	0
```

##### 申诉

**格式** - `域名`

示例：

```
peer0.rtbasia.com
peer0.rtbasia2.com
```

## 下载

#### ip

**格式** - `ip:投票的组织id...`

- 示例

```
1.119.10.254:HyLink,PUBLICISMEDIA
1.119.130.30:HyLink,PUBLICISMEDIA
1.119.131.92:Adsame,PUBLICISMEDIA
1.119.139.147:Adsame,PUBLICISMEDIA
1.119.140.242:Adsame,PUBLICISMEDIA
1.119.140.2:Adsame,PUBLICISMEDIA
```


#### device

**格式** - `设备id	设备类型	加密方式:投票的组织id...`

- 示例

```
0009A7B7-3565-4D78-A4CB-0A63B310FCF5	IDFA	RAW:PUBLICISMEDIA,RTBAsia
0009c8c1b960c3254db681649abe67a8	IMEI	MD5:LDN,RTBAsia
000C1C14-3374-414A-B334-B3930589472B	IDFA	RAW:PUBLICISMEDIA,RTBAsia
001266b95c11c0b6de232092fb6dc35c	IMEI	MD5:Adsame,LDN

```

#### domain

**格式** - `域名:投票的组织id...`

- 示例

```
peer0.rtbasia.com:HyLink,PUBLICISMEDIA
peer0.rtbasia2.com:HyLink,PUBLICISMEDIA
```


