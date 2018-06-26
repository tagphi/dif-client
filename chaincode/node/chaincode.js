const shim = require('fabric-shim')

const ORG_IDX_NAME = 'ORG'
const ORG_DELTA_IDX_NAME = 'ORGDELTA'
const ORG_REMOVE_IDX_NAME = 'ORGREMOVE'
const MERGED_IDX_NAME = 'MERGED'

var Chaincode = class {
  // 初始化链码
  async Init (stub) {
    console.info('========= DIF Init =========')

    stub.getFunctionAndParameters()

    return shim.success()
  }

  async Invoke (stub) {
    let ret = stub.getFunctionAndParameters()

    let method = this[ret.fcn]

    if (!method) {
      console.log('no method of name:' + ret.fcn + ' found')
      return shim.error('no method of name:' + ret.fcn + ' found')
    }

    try {
      let payload = await method(stub, ret.params)
      return shim.success(payload)
    } catch (err) {
      return shim.error(err.message)
    }
  }

  static __validateDataCols (data, type) {
    let validDeviceTypes = ['IMEI', 'IDFA', 'MAC', 'ANDROIDID']
    let validEncryptTypes = ['MD5', 'RAW']

    if (type === 'device') {
      let deviceType = data[1]
      let encryptType = data[2]

      if (validEncryptTypes.indexOf(encryptType) === -1) {
        throw new Error('unknown encryptType type ' + encryptType)
      }

      if (validDeviceTypes.indexOf(deviceType) === -1) {
        throw new Error('unknown device type ' + deviceType)
      }
    }

    if (type === 'default') {
      let deviceType = data[1]

      if (validDeviceTypes.indexOf(deviceType) === -1) {
        throw new Error('unknown device type ' + deviceType)
      }
    }
  }

  static __validateDeltaListFormat (row, type) {
    let cols = row.split('\t')

    if ((type === 'device' && cols.length !== 4) || (type === 'ip' && cols.length !== 2) ||
            (type === 'default' && cols.length !== 3)) {
      throw new Error('invalid format ' + row)
    }

    let flagPos = row.lastIndexOf('\t')
    flagPos++
    let flag = row.substring(flagPos)

    if (flag !== '1' && flag !== '0') {
      throw new Error('unknown flag ' + row)
    }

    Chaincode.__validateDataCols(cols, type)
  }

  static __validateRemoveListFormat (row, type) {
    let cols = row.split('\t')

    if (type === 'device' && cols.length !== 3 || type === 'ip' && cols.length !== 1 ||
            type === 'default' && cols.length !== 2) {
      throw new Error('invalid format ' + row)
    }

    Chaincode.__validateDataCols(cols, type)
  }

  static __validateType (type) {
    if (['device', 'ip', 'default'].indexOf(type) === -1) {
      throw new Error('invalid type ' + type)
    }
  }

  async uploadRemoveList (stub, args) {
    if (!args || args.length !== 2) {
      throw new Error('2 arguments are expected')
    }

    let creator = stub.getCreator()
    let mspid = creator.mspid
    let removeList = args[0]
    let type = args[1]

    Chaincode.__validateType(type)

    let lines = removeList.split('\n')

    lines.forEach((row) => {
      if (!row) { // 空行表示到了文件结尾
        return
      }

      Chaincode.__validateRemoveListFormat(row, type)
    })

    let timestamp = new Date().getTime().toString()
    let removeRecordsKey = stub.createCompositeKey(ORG_REMOVE_IDX_NAME, [timestamp, type, mspid])

    await stub.putState(removeRecordsKey, Buffer.from(removeList))
  }

  async deltaUpload (stub, args) {
    if (!args || args.length !== 2) {
      throw new Error('2 arguments are expected')
    }

    let creator = stub.getCreator()
    let mspid = creator.mspid
    let deltaList = args[0]
    let type = args[1]

    Chaincode.__validateType(type)

    let orgIdxKey = stub.createCompositeKey(ORG_IDX_NAME, [type, mspid])
    let oldListStrBuff = await stub.getState(orgIdxKey)
    let oldListStr = ''

    if (oldListStrBuff) {
      oldListStr = oldListStrBuff.toString()
    }

    let orgSet = new Set()

    if (oldListStr) {
      let oldList = JSON.parse(oldListStr)

      oldList.forEach((item) => {
        orgSet.add(item)
      })
    }

    let lines = deltaList.split('\n')

    // 合并到公司设备黑名单列表
    lines.forEach((row) => {
      if (!row) { // 空行表示到了文件结尾
        return
      }

      Chaincode.__validateDeltaListFormat(row, type)

      let flagPos = row.lastIndexOf('\t')

      let record = row.substring(0, flagPos)
      flagPos++
      let flag = row.substring(flagPos)

      if (flag === '1') { // 增加
        orgSet.add(record)
      } else if (flag === '0') { // 删除
        orgSet.delete(record)
      }
    })

    await stub.putState(orgIdxKey, Buffer.from(JSON.stringify(Array.from(orgSet))))

    // 保存此次更新的文件
    let timestamp = new Date().getTime().toString()
    let deltaRecordsKey = stub.createCompositeKey(ORG_DELTA_IDX_NAME, [timestamp, mspid, type])

    await stub.putState(deltaRecordsKey, Buffer.from(deltaList))
  }

  async getOrgList (stub, args) {
    let creator = stub.getCreator()
    let mspid = creator.mspid

    let type = args[0]

    let orgIdxKey = stub.createCompositeKey(ORG_IDX_NAME, [type, mspid])

    let result = await stub.getState(orgIdxKey)

    return result
  }

  static async __queryDeltaUploadHistory (stub, startTs, endTs) {
    let startKey = stub.createCompositeKey(ORG_DELTA_IDX_NAME, [startTs])
    let endKey = stub.createCompositeKey(ORG_DELTA_IDX_NAME, [endTs])

    let ite = await stub.getStateByRange(startKey, endKey)

    let results = []

    while (true) {
      let history = await ite.next()

      if (!history || !history.value || !history.value.key) {
        return results
      }

      let objectType
      let attributes;

      ({
        objectType,
        attributes
      } = stub.splitCompositeKey(history.value.key))

      results.push({timestamp: attributes[0],
        mspid: attributes[1],
        type: attributes[2],
        key: history.value.key
      })
    }
  }

  static async __queryRemoveListHistory (stub, startTs, endTs) {
    let startKey = stub.createCompositeKey(ORG_REMOVE_IDX_NAME, [startTs])
    let endKey = stub.createCompositeKey(ORG_REMOVE_IDX_NAME, [endTs])

    let ite = await stub.getStateByRange(startKey, endKey)

    let results = []

    while (true) {
      let history = await ite.next()

      if (!history || !history.value || !history.value.key) {
        return results
      }

      let objectType
      let attributes;

      ({
        objectType,
        attributes
      } = stub.splitCompositeKey(history.value.key))

      results.push({timestamp: attributes[0],
        mspid: attributes[2],
        type: attributes[1],
        key: history.value.key
      })
    }
  }

  async listDeltaUploadHistory (stub, args) {
    if (!args || args.length !== 2) {
      throw new Error('startime and endtime should be provided')
    }

    let startTs = args[0]
    let endTs = args[1]

    let results = await Chaincode.__queryDeltaUploadHistory(stub, startTs, endTs)

    return Buffer.from(JSON.stringify(results))
  }

  async listRemoveListUploadHistory (stub, args) {
    if (!args || args.length !== 2) {
      throw new Error('startime and endtime should be provided')
    }

    let startTs = args[0]
    let endTs = args[1]

    let results = await Chaincode.__queryRemoveListHistory(stub, startTs, endTs)

    return Buffer.from(JSON.stringify(results))
  }

  static async __getConcurredRemoveList (stub, startTs, endTs, type) {
    let latestUploadedRecords = await Chaincode.__queryDeltaUploadHistory(stub, startTs, endTs)

    let mspSet = new Set()

    latestUploadedRecords.forEach((item) => {
      mspSet.add(item.mspid)
    })

    let memberCount = mspSet.size // 此段时间上传

    console.log('There are ' + memberCount + ' members committed during the period')

    let validVoteCount = Math.round(memberCount * 4 / 9) // 需要超过4/9贡献过黑名单的组织确认移除

    let allRemoveRecords = await stub.getStateByPartialCompositeKey(ORG_REMOVE_IDX_NAME, [])

    let recordsMsp = {}

    while (true) {
      let oneUpload = await allRemoveRecords.next()

      if (!oneUpload || !oneUpload.value || !oneUpload.value.key) {
        break
      }

      let objectType
      let attributes;

      ({
        objectType,
        attributes
      } = stub.splitCompositeKey(oneUpload.value.key))

      let utype = attributes[1]
      let mspid = attributes[2]

      if (utype === type) {
        let urecords = oneUpload.value.value.toString('utf8').split('\n')

        urecords.forEach((urecord) => {
          if (urecord in urecords) {
            recordsMsp[urecord].add(mspid)
          } else {
            recordsMsp[urecord] = new Set([mspid])
          }
        })
      }
    }

    let finalList = {}

    for (let key in recordsMsp) {
      if (recordsMsp[key].size >= validVoteCount) {
        finalList[key] = 1
      }
    }

    return finalList
  }

  async merge (stub, args) {
    let type = args[0]

    let orgs = await stub.getStateByPartialCompositeKey(ORG_IDX_NAME, [type])

    let mergedList = {}

    let date = new Date()
    let endTimestamp = date.getTime().toString()

    date.setDate(date.getDate() - 30)
    let startTimestamp = date.getTime().toString()

    let skipItems = await Chaincode.__getConcurredRemoveList(stub, startTimestamp, endTimestamp, type)

    while (true) {
      let oneOrg = await orgs.next()

      if (!oneOrg || !oneOrg.value || !oneOrg.value.key) {
        break
      }

      let objectType
      let attributes;

      ({
        objectType,
        attributes
      } = stub.splitCompositeKey(oneOrg.value.key))

      let mspid = attributes[1]

      var items = JSON.parse(oneOrg.value.value.toString('utf8'))

      items.forEach((item) => {
        if (skipItems[item] == null) {
          if (item in mergedList) {
            mergedList[item].add(mspid)
          } else {
            mergedList[item] = new Set([mspid])
          }
        }
      })
    };

    let key
    let finnalList = {}

    if (type === 'device') {
      for (key in mergedList) {
        finnalList[key] = Array.from(mergedList[key])
      }
    } else {
      for (key in mergedList) {
        let concurredOrg = Array.from(mergedList[key])

        if (concurredOrg.length >= 2) {
          finnalList[key] = concurredOrg
        }
      }
    }

    let mergedListKey = stub.createCompositeKey(MERGED_IDX_NAME, [type])

    await stub.putState(mergedListKey,
      Buffer.from(JSON.stringify(finnalList)))
  }

  async getMergedList (stub, args) {
    let type = args[0]

    let mergedListKey = stub.createCompositeKey(MERGED_IDX_NAME, [type])

    let result = await stub.getState(mergedListKey)

    return Buffer.from(result)
  }

  async getDeltaList (stub, args) {
    let key = args[0]

    let result = await stub.getState(key)

    return Buffer.from(result)
  }

  async getRemoveList (stub, args) {
    let key = args[0]

    let result = await stub.getState(key)

    return Buffer.from(result)
  }
}

module.exports = Chaincode
