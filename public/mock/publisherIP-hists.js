/**
 * 模拟 媒体ip历史
 **/
let $scope = {}

$scope.showingTab = {
  type: 'publisherIP', // 默认黑名单
  histories: [{
    mspId: 'RTBAsia',
    timestamp: 1514736000,
    lines: 2,
    date: '2018-01-01'
  }], // 历史数据
  total: 1, // 总历史记录数
  pageSize: 10,
  currentPage: 1 // 页面指针
}
