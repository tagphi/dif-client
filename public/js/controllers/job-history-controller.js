/* eslint-disable handle-callback-err */
/**
 * 合并版本历史页面控制器
 **/
app.controller('JobHistoryController', function ($q, $scope, $http, $rootScope, $location, $localStorage, $timeout, $filter, HttpService, ngDialog, alertMsgService, Upload) {
  $scope.histories = []
  $scope.type = 'device'

  /**
   * 返回
   **/
  $scope.back = function () {
    window.history.back()
  }

  /**
   * 查询合并历史
   **/
  $scope.queryHists = function (type) {
    HttpService.post('/blacklist/mergedHistories', {type})
      .then(function (respData) {
        if (respData.success) {
          respData.data.forEach(function (row, id) {
            row.id = id + 1
            row.type = $scope.type

            // 转换时间戳
            let date = new Date()
            date.setTime(row.timestamp)
            row.date = $filter('date')(date, 'yyyy-MM-dd HH:mm:ss')
          })

          $scope.histories = respData.data
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
