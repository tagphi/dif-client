/* eslint-disable handle-callback-err */
/**
 * 合并版本历史页面控制器
 **/
app.controller('JobHistoryController', function ($q, $scope, $http, $rootScope, $location, $localStorage, $timeout, $filter, HttpService, ngDialog, alertMsgService, Upload) {
  $scope.histories = []
  $scope.type = 'device'
  $scope.page = {
    total: 0, // 总历史记录数
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
  $scope.queryHists = function (page) {
    let start = (page - 1) * 10
    let end = start + $scope.page.size
    HttpService.post('/blacklist/jobs', {start, end})
      .then(function (respData) {
        if (respData.success) {
          $scope.page.total = respData.data.total
          respData.data.jobs.forEach(function (job) {
            job.callbackArgs = JSON.parse(job.callbackArgs)
            job.modifiedTime = new Date(job.modifiedTime).toLocaleString()
          })
          $scope.histories = respData.data.jobs
        } else {
          alertMsgService.alert('获取失败', false)
          $scope.histories = []
          $scope.page.total = 0
        }
      })
      .catch(function (err) {
        alertMsgService.alert('获取失败', false)
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
