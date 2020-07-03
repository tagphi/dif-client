'use strict'

angular.module('dif').factory('xutils', ['$http', '$q', '$rootScope', '$location', 'alertMsgService',
  function ($http, $q, $rootScope, $location, alertMsgService) {
    return {
      type2Name: function (type) {
        switch (type) {
          case 'ip':
            return 'IP黑名单'

          case 'device':
            return '设备ID黑名单'

          case 'default':
            return '设备ID白名单'

          case 'domain':
            return '域名黑名单'

          case 'ua_spider':
            return 'UA特征(机器及爬虫)'

          case 'ua_client':
            return 'UA特征(合格客户端)'

          case 'publisher_ip':
            return 'IP白名单'
        }
      }
    }
  }])
