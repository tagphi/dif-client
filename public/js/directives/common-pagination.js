/**
 * 分页器指令
 **/
angular.module('dif').directive('commonPagination', function ($http, $q, alertMsgService) {
    return {
        restrict: 'AE',
        templateUrl: 'views/nav/pagination.html',
        scope: {
            list: '=', //列表数据
            listType: '=',//列表数据的类型
            url: '@', //接口url
            method: '@', //get or post
            requestParam: '@', //请求参数
            requestData: '@', //请求对象数据
            event: '@' //事件名, 外部调用分页查询的事件
        },
        link: function (scope, element) {
            //配置参数
            scope.conf = {
                currentPage: 1,
                totalPage: 1,
                endPage: 1,
                pageSize: 10,
                pages: [],
                total: 0,
            };

            //监听事件
            scope.$on(scope.event, function (event, data) {

                scope.payload = data;

                //加载
                scope.loadData(data);
            });

            //ajax服务
            var AjaxService = {
                post: function (url, params, data) {
                    var defered = $q.defer();
                    let payload = {
                        method: 'POST',
                        url: url,
                        params: params,
                        data: data
                    }
                    $http(payload)
                        .then(function (data) {
                            defered.resolve(data);
                        }, function (err) {
                            defered.reject(err);
                        })

                    return defered.promise;
                }
            };

            //加载数据
            scope.loadData = function (data) {
                if (data) {
                    data.pageNO = scope.conf.currentPage;
                    data.pageSize = scope.conf.pageSize;
                }

                scope.requestParam = scope.requestParam instanceof Object && scope.requestParam || {};
                scope.requestData = scope.requestData instanceof Object && scope.requestData || {};
                scope.requestParam.page = scope.conf.currentPage;
                scope.requestParam.pageSize = scope.conf.pageSize;

                var promise = null;
                if (scope.method == 'GET') {
                    promise = AjaxService.get(scope.url, scope.requestParam);
                } else if (scope.method == 'POST') {
                    if (data) {
                        promise = AjaxService.post(scope.url, scope.requestParam, data);
                    } else {
                        promise = AjaxService.post(scope.url, scope.requestParam, scope.requestData);
                    }
                }

                promise
                    .then(function (resp) {

                        let respData = resp.data;

                        if (respData.success) {
                            alertMsgService.alert("获取成功", true);
                            respData.data.forEach(function (row) { //转换时间戳
                                let date = new Date();
                                date.setTime(row.timestamp);
                                row.date = date.format("yyyy-MM-dd");
                            })

                            scope.list = respData.data;
                            scope.conf.total = respData.total;
                        } else {
                            alertMsgService.alert("获取失败", false);
                            scope.list = [];
                            scope.conf.total = 0;
                        }

                        scope.calcPages();
                    })
                    .catch(function (err) {
                        alertMsgService.alert("获取失败", false);
                    });
            };

            //改变页大小
            scope.changePageSize = function (n) {
                scope.conf.pageSize = n;
                scope.conf.currentPage = 1;
                scope.loadData(scope.payload);
            };

            //下一页
            scope.next = function () {
                if (scope.conf.currentPage < scope.conf.totalPage) {
                    scope.conf.currentPage++;
                    scope.loadData(scope.payload);
                }
            };

            //上一页
            scope.prev = function () {
                if (scope.conf.currentPage > 1) {
                    scope.conf.currentPage--;
                    scope.loadData(scope.payload);
                }
            };

            //加载指定页
            scope.loadPage = function (page) {
                if (scope.conf.currentPage != page) {
                    scope.conf.currentPage = page;
                    scope.loadData(scope.payload);
                }
            };

            /**
             * 生成页数
             **/
            function genPages(curPage, forwordStep, backwordsStep) {
                let pages = [];
                if (forwordStep && forwordStep >= 1) {
                    for (let i = forwordStep; i > 0; i--) {  //生成小页码
                        pages.push(curPage - i);
                    }
                }

                pages.push(curPage);

                if (backwordsStep && backwordsStep >= 1) { //生成大页码
                    for (let i = 1; i < backwordsStep; i++) {
                        pages.push(curPage + i);
                    }
                }

                scope.conf.pages = pages;
            }

            //计算页数
            scope.calcPages = function () {
                let FIXED_PAGES = 5; //固定页数
                //计算总页数
                scope.conf.totalPage = Math.ceil(scope.conf.total / scope.conf.pageSize);

                if (scope.conf.totalPage <= 8) { //8页以下，全部生成
                    genPages(scope.conf.currentPage,
                        scope.conf.currentPage - 1,
                        scope.conf.totalPage - scope.conf.currentPage + 1);
                } else { //8页以上，生成固定页数5
                    let isFront = scope.conf.currentPage <= FIXED_PAGES;
                    let isBackwords = ((scope.conf.totalPage - scope.conf.currentPage) <= FIXED_PAGES);
                    //处于中间
                    if (!isFront && !isBackwords) {
                        genPages(scope.conf.currentPage, 2, 2); //前后各移动2步
                    }

                    //靠前
                    if (isFront) {
                        genPages(scope.conf.currentPage, scope.conf.currentPage - 1, FIXED_PAGES - scope.conf.currentPage);
                    }

                    //靠后
                    if (isBackwords) {
                        genPages(scope.conf.currentPage
                            , FIXED_PAGES - (scope.conf.totalPage - scope.conf.currentPage)
                            , scope.conf.totalPage - scope.conf.currentPage - 1)
                    }
                }
            };

        }
    };
});
