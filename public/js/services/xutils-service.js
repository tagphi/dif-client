'use strict'

angular.module('dif').factory('xutils', ['$http', '$q', '$rootScope', '$location', 'alertMsgService', '$filter',
  function ($http, $q, $rootScope, $location, alertMsgService, $filter) {
    return {
      /*
      * 类型转换为中文名
      * */
      type2Name: type => {
        switch (type) {
          case 'ip':
            return 'IP黑名单'

          case 'device':
            return '设备ID黑名单'

          case 'default':
            return '设备ID灰名单'

          case 'domain':
            return '域名黑名单'

          case 'ua_spider':
            return 'UA特征(机器及爬虫)'

          case 'ua_client':
            return 'UA特征(合格客户端)'

          case 'publisher_ip':
            return 'IP白名单'
        }
      },
      /*
      * 获取指定日期的月天数
      * */
      daysOfMonth: date => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
      /*
      * 是否是新的版本规则
      * 新旧版本日期分界线 2020-06-22
      * 新规则要求本月发布的版本是下个月
      * */
      newVersionRule: date => date.getTime() > 1592755200000,
      dateToFull: date => $filter('date')(date, 'yyyy-MM-dd HH:mm:ss'),
      dateToYMD: (date) => $filter('date')(date, 'yyyyMMdd'),
      dateToSlashedYMD: (date) => $filter('date')(date, 'yyyy/MM/dd'),
      dateToYM :(date)=> $filter('date')(date, 'yyyyMM'),
      nextMonth: pubDate => {
        let nextPubDate = new Date(pubDate.getTime())
        nextPubDate.setMonth(pubDate.getMonth() + 1)
        return nextPubDate
      },
      addDays: (date, days) => {
        let newDate = new Date(date.getTime())
        newDate.setDate(date.getDate() + days)
        return newDate
      },
      leftTime: nextPubDate => {
        let delta = nextPubDate.getTime() - new Date().getTime()

        let UNIT_SECOND = 1000
        let UNIT_MINUTE = UNIT_SECOND * 60
        let UNIT_HOUR = UNIT_MINUTE * 60

        let hour = Math.floor(delta / UNIT_HOUR)
        let minute = Math.floor((delta - hour * UNIT_HOUR) / UNIT_MINUTE)
        let seconds = Math.floor((delta - hour * UNIT_HOUR - minute * UNIT_MINUTE) / UNIT_SECOND)
        return hour + ':' + minute + ':' + seconds;
      },
      go: path => $location.path(path),
      goHome: () => $location.path('/')
    }
  }])
