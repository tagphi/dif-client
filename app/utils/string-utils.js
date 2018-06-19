var stringUtils = {
  isEmpty (data) { // 是否为空字符串
    if (!data) return true
    return false
  },
  isShorter (data, expectMin) { // 长度是否小于指定值
    if (expectMin < 0) { throw new Error('长度值不能小于0') }
    if (this.isEmpty(data)) return true
    if (data.length < expectMin) return true
    return false
  },
  isLonger (data, expectMax) { // 长度是否长于
    if (expectMax < 0) { throw new Error('长度值不能小于0') }
    if (this.isEmpty(data)) return false
    if (data.length > expectMax) {
      return true
    }
    return false
  },
  isLengthBetween (data, min, max) { // 判断长度是否在指定区间
    if (min >= max) { throw new Error('min不能大于max') }
    if (!this.isShorter(data, min) && !this.isLonger(data, max)) {
      return true
    }
    return false
  },
  utf8ToUnicode (strUtf8) {
    var i, j
    var uCode
    var temp = new Array()

    for (i = 0, j = 0; i < strUtf8.length; i++) {
      uCode = strUtf8.charCodeAt(i)
      if (uCode < 0x100) { // ASCII字符
        temp[j++] = 0x00
        temp[j++] = uCode
      } else if (uCode < 0x10000) {
        temp[j++] = (uCode >> 8) & 0xff
        temp[j++] = uCode & 0xff
      } else if (uCode < 0x1000000) {
        temp[j++] = (uCode >> 16) & 0xff
        temp[j++] = (uCode >> 8) & 0xff
        temp[j++] = uCode & 0xff
      } else if (uCode < 0x100000000) {
        temp[j++] = (uCode >> 24) & 0xff
        temp[j++] = (uCode >> 16) & 0xff
        temp[j++] = (uCode >> 8) & 0xff
        temp[j++] = uCode & 0xff
      } else {
        break
      }
    }
    temp.length = j
    return temp
  },
  isTrue (str) {
    return (str == true || str == 'true')
  }
}

module.exports = stringUtils
