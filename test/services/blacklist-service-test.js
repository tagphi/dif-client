let blacklistService = require('../../app/services/blacklist-service')
let assert = require('assert')
describe('测试黑名单服务', function () {
  it('合并新旧列表', function () {
    let currentList = 'device1\tIMEI\tMD5\n' +
      'device3\tIMEI\tMD5'

    let newList = 'device1\tIMEI\tMD5\n' +
      'device2\tIMEI\tMD5\n' +
      'device4\tIMEI\tMD5\n' +
      'device3\tIMEI\tMD5\n' +
      'device6\tIMEI\tMD5\n' +
      'device1\tIMEI\tMD5'

    let mergedListStr = blacklistService.merge(currentList, newList)
    let expected = 'device1\tIMEI\tMD5\n' +
      'device3\tIMEI\tMD5\n' +
      'device2\tIMEI\tMD5\n' +
      'device4\tIMEI\tMD5\n' +
      'device6\tIMEI\tMD5'

    assert.equal(mergedListStr, expected, '合并出错')
  })
})
