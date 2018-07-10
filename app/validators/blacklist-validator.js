/* eslint-disable no-trailing-spaces */
function __validateDataCols (data, type) {
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

function validateDeltaListFormat (row, type) {
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

  __validateDataCols(cols, type)
}

function _validateRemoveListFormat (row, type) {
  let cols = row.split('\t')

  if ((type === 'device' && cols.length !== 3) || (type === 'ip' && cols.length !== 1) ||
    (type === 'default' && cols.length !== 2)) {
    throw new Error('invalid format ' + row)
  }

  __validateDataCols(cols, type)
}

function _validateType (type) {
  if (['device', 'ip', 'default'].indexOf(type) === -1) {
    throw new Error('invalid type ' + type)
  }
}

function validateUpload (dataType, type, dataListStr) {
  _validateType(type)

  let dataList = dataListStr.split('\n')
  dataList.forEach(function (row) {
    if (dataType === 'delta') { // 黑名单
      validateDeltaListFormat(row, type)
    } else {
      _validateRemoveListFormat(row, type)
    }
  })
}

exports.validateUpload = validateUpload
