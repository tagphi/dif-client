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
  $scope.back = () => window.history.back()

  /*
  * 主版本
  * */
  function mainVersion (pubDate) {
    return xutils.newVersionRule(pubDate) ? xutils.dateToYM(pubDate) : xutils.dateToYMD(pubDate);
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
    function versionByDate (pubDate) {
      let mainVer = mainVersion(pubDate);

      let total = versionTotalByDate[mainVer] || 1
      let curCount = versionCounterByDate[mainVer]

      return versionCounterByDate[mainVer] = !curCount ? total : curCount - 1
    }

    /*
    * 统计每日发布的版本总数
    * */
    $scope.histories.forEach((row) => {
      let mainVer = mainVersion(new Date(parseInt(row.timestamp)));
      let total = versionTotalByDate[mainVer]
      versionTotalByDate[mainVer] = total ? total + 1 : 1
    })

    $scope.histories.forEach(function (record, i) {
      let nextRecord = undefined

      if (i != 0) { // 不是最后一个元素
        nextRecord = $scope.histories[i - 1]
      }

      record.id = i + 1
      record.type = $scope.type

      // 转换时间戳
      let pubDate = new Date(parseInt(record.timestamp))
      record.date = xutils.dateToFull(pubDate)

      // 版本
      let pubDateYMD = xutils.dateToYMD(pubDate)
      let pubDateYM = xutils.dateToYM(pubDate)

      let nextPubDate = xutils.nextMonth(pubDate)
      let nextMonthYM = xutils.dateToYM(nextPubDate)

      if (!xutils.newVersionRule(pubDate)) { // 旧版本
        record.version = pubDateYMD + '_' + versionByDate(pubDate)
        record.validPeriod = `${pubDateYM}28 ~ ${nextMonthYM}28`
      } else { // 新版本
        record.version = nextMonthYM + '_' + versionByDate(nextPubDate)
        record.validPeriod = `${nextMonthYM}01 ~ ${nextMonthYM}${xutils.daysOfMonth(nextPubDate)}`
      }

      record.filename = record.type + '_' + record.version
    })
  }

  /**
   * 查询合并历史
   **/
  $scope.queryHists = function (type) {
    HttpService.post('/blacklist/mergedHistories', {type})
      .then(({data, success}) => {
        if (success) {
          $scope.histories = data

          // 转换类型
          $scope.histories.forEach((hist, id) => hist.type = xutils.type2Name(hist.type))

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
  $scope.selectTab = type => {
    $scope.type = type

    // 查询
    $scope.queryHists(type)
  }

  ;(() => {
    $scope.queryHists($scope.type)
  })()
})
