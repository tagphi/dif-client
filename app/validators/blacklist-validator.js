function _validateType (type) {
  if (['device', 'ip', 'default'].indexOf(type) === -1) throw new Error('invalid type ' + type)
}

function __validateDataCols (dataCols, type) {
  let validDeviceTypes = ['IMEI', 'IDFA', 'MAC', 'ANDROIDID']
  let validEncryptTypes = ['MD5', 'RAW']
  let validIpTypes = ['1', '2', '3', '4', '5', '6', '7']

  let deviceType
  switch (type) {
    case 'device':
      deviceType = dataCols[1]
      let encryptType = dataCols[2]
      if (validEncryptTypes.indexOf(encryptType) === -1) throw new Error('unknown encryptType type ' + encryptType)
      if (validDeviceTypes.indexOf(deviceType) === -1) throw new Error('unknown device type ' + deviceType)
      break

    case 'ip':
      if (type === 'delta') {
        let ipType = dataCols[1]
        if (validIpTypes.indexOf(ipType) === -1) throw new Error('unknown ip type ' + ipType)
      }
      break

    default:
      deviceType = dataCols[1]
      if (validDeviceTypes.indexOf(deviceType) === -1) throw new Error('unknown device type ' + deviceType)
  }
}

function _validateDeltaListFormat (row, type) {
  let cols = row.split('\t')
  let numOfCols = cols.length
  if ((type === 'device' && numOfCols !== 4) ||
    (type === 'ip' && numOfCols !== 3) ||
    (type === 'default' && numOfCols !== 3)) throw new Error('invalid format ' + row)

  let flagPos = row.lastIndexOf('\t')
  flagPos++
  let flag = row.substring(flagPos)
  let validFlags = ['0', '1']
  if (validFlags.indexOf(flag) === -1) throw new Error('unknown flag ' + row)

  __validateDataCols(cols, type)
}

/**
 * 验证申诉数据格式
 **/
function _validateAppealListFormat (row, type) {
  let cols = row.split('\t')
  let numOfCols = cols.length
  if ((type === 'device' && numOfCols !== 3) ||
    (type === 'ip' && numOfCols !== 1) ||
    (type === 'default' && numOfCols !== 2)) throw new Error('invalid format ' + row)

  __validateDataCols(cols, type)
}

function validateUpload (dataType, type, dataListStr) {
  _validateType(type)

  let dataList = dataListStr.split('\n')
  dataList.forEach(function (row) {
    if (row && row.trim() !== '') { // 空行可以是最后一行 被忽略
      if (dataType === 'delta') { // 黑名单
        _validateDeltaListFormat(row, type)
      } else { // 申诉
        _validateAppealListFormat(row, type)
      }
    }
  })
}

exports.validateUpload = validateUpload
