/**
 * 模拟 申诉ip历史
 **/
let $scope = {}

$scope.showingTab = {
  type: 'appeal',
  histories: [{
    mspId: 'RTBAsia',
    timestamp: 1514736000,
    lines: 2,
    date: '2018-01-01',
    details: {
      summaryShot: '哈哈以；I将安静of得；奥计费哦啊接群殴拗口；pdkopakopdkakodkwakaj',
      summary: '哈哈以；I将安静of得；奥计费哦啊接群殴拗口；pdkopakopdkakodkwakaj哈哈以；I将安静of得；奥计费哦啊接群殴拗口；pdkopakopdkakodkwakaj哈哈以；I将安静of得；奥计费哦啊接群殴拗口；pdkopakopdkakodkwakaj哈哈以；I将安静of得；奥计费哦啊接群殴拗口；pdkopakopdkakodkwakaj',
      status: 0,
      agree: ['RTBAsia'],
      against: ['htt']
    }
  }, {
    mspId: 'RTBAsia',
    timestamp: 1514736000,
    lines: 2,
    date: '2018-01-01',
    details: {
      summaryShot: '哈哈以；I将安静of得；奥计费哦啊接群殴拗口；pdkopakopdkakodkwakaj',
      summary: '哈哈以；I将安静of得；奥计费哦啊接群殴拗口；pdkopakopdkakodkwakaj哈哈以；I将安静of得；奥计费哦啊接群殴拗口；pdkopakopdkakodkwakaj哈哈以；I将安静of得；奥计费哦啊接群殴拗口；pdkopakopdkakodkwakaj哈哈以；I将安静of得；奥计费哦啊接群殴拗口；pdkopakopdkakodkwakaj',
      status: 0,
      agree: ['RTBAsia'],
      against: ['htt']
    }
  }], // 历史数据
  total: 1, // 总历史记录数
  pageSize: 10,
  currentPage: 1 // 页面指针
}
