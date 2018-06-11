'use strict';

/**
 *  【http请求客户端】
 **/
angular.module('dif').factory('HttpService', ['$http', '$q', '$rootScope', '$location',
    function ($http, $q, $rootScope, $location) {
        var httpClient = {

            /**
             *  post 请求
             **/
            post: function (url, data) {
                if (!data) {
                    data = {};
                }

                data.token = sessionStorage.getItem("token");

                // token不存在，跳转到首页
                if (!data.token) {
                    alert("token不存在，无法获取数据")
                    $location.path("/");
                }

                var req = {
                    method: 'POST',
                    url: url,
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    data: data
                };

                var deferred = $q.defer();
                var promise = deferred.promise;

                $http(req).then(function (response) {
                    let resData=response.data;

                    if (resData.success) {
                        //保存token
                        if (resData.token){
                            sessionStorage.setItem("token",resData.token);
                            console.log("写入token————>",resData.token);
                        }

                       return deferred.resolve(resData);
                    } else {
                        let dataMsg=resData.message;
                        if (dataMsg != null && dataMsg != '') {
                            console.log(dataMsg);
                        }

                        //验证token
                        if (dataMsg && dataMsg.indexOf("token")!=-1) { //token失效或过期
                            alert("token失效，请重新登录");
                            $location.path("/");
                        }

                      return  deferred.resolve(resData);
                    }

                }).catch(function (error) {
                    deferred.reject(error);

                    console.log("网络错误");
                });

                return promise;
            }
        };


        return httpClient;
    }]);


