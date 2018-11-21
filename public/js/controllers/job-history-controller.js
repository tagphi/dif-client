/* eslint-disable handle-callback-err */
/**
 * 合并版本历史页面控制器
 **/
app.controller('JobHistoryController', function ($q, $scope, $http, $rootScope, $location, $localStorage, $timeout, $filter, HttpService, ngDialog, alertMsgService, Upload) {
  $scope.histories = mock.jobHistories
  $scope.type = 'device'
  $scope.page = {
    total: 11, // 总历史记录数
    pageSize: 10,
    currentPage: 1 // 页面指针
  }

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

  function init () {
    $scope.queryHists($scope.type)

    // 监听所有面板的选项中页面的变化
    $scope.$watch('page.currentPage', function (newCurPage, old) {
      if (newCurPage === 1 && old === 1) return
      $scope.queryHists(newCurPage)
    })
  }

  init()
})
