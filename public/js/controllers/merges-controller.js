/* eslint-disable handle-callback-err */
/**
 * 合并版本历史页面控制器
 **/
app.controller('MergesController', function ($q, $scope, $http, $rootScope, $location, $localStorage, $timeout, $filter, HttpService, ngDialog, alertMsgService, Upload) {
  $scope.histories = []
  $scope.type = 'device'

  /**
   * 返回
   **/
  $scope.back = function () {
    window.history.back()
  }

  /**
   * 格式化历史数据
   **/
  function formatHistories () {
    /**
     * dateCounter
     {
      '20191011':2 // 该日合并版本计数器
     }
     **/
    let dateVersionCounter = {}
    let dateVersionTotal = {}

    /**
     * 查询该日期的版本计数器
     *  每次获取当前版本+1，作为最新的版本
     **/
    function dateVersion (date) {
      let curCount = dateVersionCounter[date]
      let total = dateVersionTotal[date]

      if (!curCount) {
        curCount = total
      } else {
        curCount = curCount - 1
      }

      dateVersionCounter[date] = curCount
      return curCount
    }

    $scope.histories.forEach(function (row, id) {
      let date = new Date()
      date.setTime(row.timestamp)
      row.date = $filter('date')(date, 'yyyy-MM-dd HH:mm:ss')
      row.dateSimp = $filter('date')(date, 'yyyyMMdd')

      let total = dateVersionTotal[row.dateSimp]

      if (total) {
        total += 1
      } else {
        total = 1
      }

      dateVersionTotal[row.dateSimp] = total
    })

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

          // 转换类型
          $scope.histories.map(function (hist, id) {
            let type = hist.type

            if (!type) {
              return
            }

            switch (type) {
              case 'ip':
                hist.type = 'IP黑名单'
                break

              case 'ua_spider':
                hist.type = 'UA特征(机器及爬虫)'
                break

              case 'ua_client':
                hist.type = 'UA特征(合格客户端)'
                break

              case 'domain':
                hist.type = '域名黑名单'
                break

              case 'device':
                hist.type = '设备ID黑名单'
                break

              case 'default':
                hist.type = '设备ID白名单'
                break

              case 'publisher_ip':
                hist.type = 'IP白名单'
                break
            }
          })

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
