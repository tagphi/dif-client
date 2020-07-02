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
    let versionCounterByDate = {}
    let versionTotalByDate = {}

    /**
     * 查询该日期的版本计数器
     *  每次获取当前版本+1，作为最新的版本
     **/
    function versionByDate (date) {
      let total = versionTotalByDate[date]
      let curCount = versionCounterByDate[date]

      versionCounterByDate[date] = !curCount ? total : curCount - 1
      return curCount
    }

    /*
    * 是否是新的版本规则
    * 新旧版本日期分界线 2020-06-21
    * 新规则要求本月发布的版本是下个月
    * */
    function newVersionRule (date) {
      const dividerDate = 1592668800000
      return date.getTime() > dividerDate
    }

    /*
    * 获取指定日期的月天数
    * */
    function daysOfMonth (date) {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    /*
    * 统计每日发布的版本总数
    * */
    $scope.histories.forEach(function (row, id) {
      let dateSimp = $filter('date')(new Date(parseInt(row.timestamp)), 'yyyyMMdd')

      let total = versionTotalByDate[dateSimp]
      versionTotalByDate[dateSimp] = total ? total + 1 : 1
    })

    $scope.histories.forEach(function (row, id) {
      row.id = id + 1
      row.type = $scope.type

      // 转换时间戳
      let date = new Date(parseInt(row.timestamp))
      row.date = $filter('date')(date, 'yyyy-MM-dd HH:mm:ss')

      // 版本
      row.dateSimp = $filter('date')(date, 'yyyyMMdd')
      row.version = row.dateSimp + '_' + versionByDate(row.dateSimp)

      let isNewRule = newVersionRule(date)

      let yearMonth = $filter('date')(date, 'yyyyMM')
      date.setMonth(date.getMonth() + 1)
      let nextYearMonth = $filter('date')(date, 'yyyyMM')

      // 有效期
      if (isNewRule) { // 新版规则
        row.validPeriod = `${nextYearMonth}01 ~ ${nextYearMonth}${daysOfMonth(date)}`
      } else { // 新规则
        row.validPeriod = `${yearMonth}20 ~ ${nextYearMonth}20`
      }

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
            if (!hist.type) return

            switch (hist.type) {
              case 'ip':
                hist.type = 'IP黑名单'
                break

              case 'domain':
                hist.type = '域名黑名单'
                break

              case 'ua_spider':
                hist.type = 'UA特征(机器及爬虫)'
                break

              case 'ua_client':
                hist.type = 'UA特征(合格客户端)'
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

          // 格式化历史数据
          formatHistories()
        } else {
          alertMsgService.alert('获取失败', false)
          $scope.histories = []
        }
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
