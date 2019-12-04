/* eslint-disable handle-callback-err */
/**
 * 合并版本历史页面控制器
 **/
app.controller('MergesController', function ($q, $scope, $http, $rootScope, $location, $localStorage, $timeout, $filter, HttpService, ngDialog, alertMsgService, Upload) {
  $scope.histories = []
  $scope.type = 'device'

  /**
   * dateCounter
   {
    '20191011':2 // 该日合并版本计数器
   }
   **/
  let dateVersionCounter = {}

  /**
   * 返回
   **/
  $scope.back = function () {
    window.history.back()
  }

  /**
   * 查询该日期的版本计数器
   *  每次获取当前版本+1，作为最新的版本
   **/
  function dateVersion (date) {
    let curCount = dateVersionCounter[date]

    if (!curCount) {
      curCount = 0
    }

    dateVersionCounter[date] = curCount + 1

    return dateVersionCounter[date]
  }

  /**
   * 格式化历史数据
   **/
  function formatHistories () {
    $scope.histories.forEach(function (row, id) {
      row.id = id + 1
      row.type = $scope.type

      // 转换时间戳
      let date = new Date()
      date.setTime(row.timestamp)
      row.date = $filter('date')(date, 'yyyy-MM-dd HH:mm:ss')
      row.dateSimp = $filter('date')(date, 'yyyyMMdd')

      row.version = row.dateSimp + '_' + dateVersion(row.dateSimp)
      row.filename = row.type + '_' + row.version
    })
  }

  /**
   * 查询合并历史

   **/
  $scope.queryHists = function (type) {
    HttpService.post('/blacklist/mergedHistories', {type})
      .then(function (respData) {
        if (respData.success) {
          $scope.histories = respData.data

          formatHistories()
        } else {
          alertMsgService.alert('获取失败', false)
          $scope.histories = []
        }
      })
      .catch(function (err) {
        alertMsgService.alert('投票失败', false)
      })
  }

  /**
   * 标签选择
   */
  $scope.selectTab = function (type) {
    $scope.type = type

    // 查询
    $scope.queryHists(type)
  }

  ;(function init () {
    $scope.queryHists($scope.type)
  })()
})
