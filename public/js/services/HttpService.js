'use strict'

angular.module('dif').factory('HttpService', ['$http', '$q', '$rootScope', '$location', 'alertMsgService',
  function ($http, $q, $rootScope, $location) {
    var httpClient = {
      post: function (url, data) {
        if (!data) {
          data = {}
        }

        data.token = sessionStorage.getItem('token')

        // token不存在，跳转到首页
        if (!data.token) {
          alertMsgService.alert('token不存在，无法获取数据', false)
          $location.path('/')
        }

        var req = {
          method: 'POST',
          url: url,
          headers: {
            'Content-Type': 'application/json;charset=utf-8'
          },
          data: data
        }

        var deferred = $q.defer()
        var promise = deferred.promise

        $http(req).then(function (response) {
          let resData = response.data

          if (resData.success) {
            // 保存token
            if (resData.token) {
              sessionStorage.setItem('token', resData.token)
            }

            return deferred.resolve(resData)
          } else {
            let dataMsg = resData.message

            // 验证token
            if (dataMsg && dataMsg.indexOf('token') !== -1) { // token失效或过期
              $location.path('/')
            }

            return deferred.resolve(resData)
          }
        }).catch(function (error) {
          deferred.reject(error)

          console.log('网络错误')
        })

        return promise
      }
    }

    return httpClient
  }])
