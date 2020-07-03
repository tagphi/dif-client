/* eslint-disable handle-callback-err */
/**
 * 合并版本历史页面控制器
 **/
app.controller('MergesController', function ($q, $scope, $http, $rootScope, $location, $localStorage, $timeout, $filter, HttpService, ngDialog, alertMsgService, Upload, xutils) {
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

      return versionCounterByDate[date] = !curCount ? total : curCount - 1
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

    $scope.histories.forEach(function (record, i) {
      let nextRecord = undefined

      if (i != 0) { // 不是最后一个元素
        nextRecord = $scope.histories[i - 1]
      }

      record.id = i + 1
      record.type = $scope.type

      // 转换时间戳
      let date = new Date(parseInt(record.timestamp))
      record.date = $filter('date')(date, 'yyyy-MM-dd HH:mm:ss')

      // 版本
      record.dateSimp = $filter('date')(date, 'yyyyMMdd')
      record.version = record.dateSimp + '_' + versionByDate(record.dateSimp)

      let validStart = $filter('date')(date, 'yyyyMMdd')

      let nextPubDate

      if (nextRecord) { // 下个版本已发布,有效期截止为下个版本发布期
        nextPubDate = new Date(parseInt(nextRecord.timestamp))
      } else { // 下个版本未发布，推一个月
        date.setMonth(date.getMonth() + 1)
        date.setDate(28)
        nextPubDate = date
      }

      let validEnd = $filter('date')(nextPubDate, 'yyyyMMdd')
      record.validPeriod = `${validStart} ~ ${validEnd}`

      record.filename = record.type + '_' + record.version
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
          $scope.histories.forEach(function (hist, id) {
            hist.type = xutils.type2Name(hist.type)
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
