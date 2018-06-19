app.controller('HistoryController', function ($q, $scope, $http, $rootScope, $location, $localStorage, $timeout, $filter,
                                              HttpService, ngDialog, alertMsgService) {
    /**
     * 退出
     */
    $scope.logout = function () {
        HttpService.post('/auth/logout')
            .then(function (respData) {
                $location.path('/')
            })
            .catch(function (err) {
                console.log(err)
                $location.path('/')
            })
    }

    const TAB_IDS = ['blacklistTab', 'removelistTab']
    $scope.selectTabID = 'blacklistTab' // 默认选中的标签为blacklist
    $scope.showblacklist = true

    $scope.pageSize = 3

    /**
     * blacklist面板状态
     */
    $scope.blacklistTab = {
        type: 'blacklist',
        show: true, // 显示
        histories: [], // 历史数据
        total: 0, // 总历史记录数
        currentPage: 1 // 页面指针
    }

    /**
     * removelist面板状态
     */
    $scope.removelistTab = {
        type: 'removelist',
        show: false, // 默认不显示
        histories: [], // 历史数据
        total: 0, // 总历史记录数
        currentPage: 1 // 页面指针
    }

    /**
     * 上传黑名单对话框
     */
    $scope.openUploadDlg = function () {
        let dlgOpts = {
            template: 'views/dlgs/upload-dlg.html',
            scope: $scope,
            controller: ['$scope', 'HttpService', function ($scope, HttpService) {
                $scope.selectFileName = '...'

                $scope.confirmActionText = '上传'
                $scope.dataType = 'delta'

                /**
                 * 文件改变
                 */
                $scope.fileNameChanged = function (files) {
                    $scope.uploadFile = files[0]
                    $scope.selectFileName = $scope.uploadFile.name
                    document.getElementById('labelSelectFile').innerText = $scope.selectFileName
                }

                /**
                 * 上传黑名单
                 */
                $scope.postBlacklist = function () {
                    if (!$scope.uploadFile) {
                        $scope.closeThisDialog()
                        alertMsgService.alert('请先选择文件', false)
                        return
                    }

                    var formData = new FormData()
                    formData.set('dataType', $scope.dataType) // 类型
                    formData.set('type', $scope.selectType) // 类型
                    formData.append('file', $scope.uploadFile)

                    let payload = {
                        url: '/blacklist/upload',
                        method: 'POST',
                        data: formData,
                        headers: {'Content-Type': undefined},
                        transformRequest: angular.identity
                    }

                    $scope.closeThisDialog()
                    $http(payload)
                        .then(function (resp) {
                            var data = resp.data

                            if (data.success) {
                                alertMsgService.alert('提交成功', true)
                                $scope.queryHistories()
                            } else {
                                alertMsgService.alert(data.message, false)
                            }
                        }).catch(function (err) {
                        alertMsgService.alert(err, false)
                    })
                }
            }]
        }
        ngDialog.open(dlgOpts)
    }

    /**
     * 下载对话框
     */
    $scope.openDownloadDlg = function () {
        let dlgOpts = {
            template: 'views/dlgs/download-dlg.html',
            scope: $scope,
            controller: ['$scope', 'HttpService', function ($scope, HttpService) {
                $scope.dataType = $scope.dataType || "ip";
            }]
        }

        ngDialog.open(dlgOpts)
    }

    /**
     * 查询
     */
    $scope.queryHistories = function (pageNO) {
        // 获取日期范围
        let dataRange = getDateRange()

        let selectedTabID = $scope.selectTabID

        let payload = {
            startDate: dataRange[0],
            endDate: dataRange[1],
            pageSize: $scope.pageSize
        }

        payload.dataType = selectedTabID === 'blacklistTab' ? 'delta' : 'remove'
        payload.pageNO = pageNO || $scope[selectedTabID].currentPage

        HttpService.post('/blacklist/histories', payload)
            .then(function (respData) {
                if (respData.success) {
                    respData.data.forEach(function (row) { // 转换时间戳
                        let date = new Date()
                        date.setTime(row.timestamp)
                        row.date = $filter('date')(date, 'yyyy-MM-dd')
                    })

                    $scope[selectedTabID].histories = respData.data
                    $scope[selectedTabID].total = respData.total
                    alertMsgService.alert('获取成功', true);
                } else {
                    alertMsgService.alert('获取失败', false)
                    $scope[selectedTabID].histories = []
                    $scope[selectedTabID].total = []
                }

                if (!pageNO) {
                    $scope[selectedTabID].currentPage = 1
                }
            })
            .catch(function (err) {
                alertMsgService.alert(err, false)
            })
    }

    /**
     * 清空日期
     */
    $scope.clearDate = function () {
        $scope.dateRange = ''
    }

    /**
     * 标签选择
     */
    $scope.selectTab = function (tabID) {
        $scope.selectTabID = tabID

        // 隐藏所有面板
        TAB_IDS.forEach(function (tab) {
            $scope[tab].show = false
        })

        // 显示指定面板
        $scope[tabID].show = true

        if ($scope[tabID].histories.length === 0) { // 无数据才查询
            // 查询
            $scope.queryHistories()
        }
    }

    /**
     * 初始化日期选择器
     */
    function initDatePicker() {
        lay('#version').html('-v' + laydate.v)
        // 执行一个laydate实例
        laydate.render({
            elem: '#date', // 指定元素
            type: 'date',
            range: true
        })
    }

    /**
     * 获取日期范围
     */
    function getDateRange() {
        let dataRange = document.getElementById('date').value

        if (!dataRange) { // 默认查询最近一周的记录
            let nowDate = new Date()

            let endDateStr = $filter('date')(new Date(nowDate.setDate(nowDate.getDate() + 1)), 'yyyy-MM-dd')
            let startDateStr = $filter('date')(new Date(nowDate.setDate(nowDate.getDate() - 7)), 'yyyy-MM-dd')

            dataRange = [startDateStr, endDateStr]
        } else {
            dataRange = dataRange.split(' - ')
        }

        return dataRange
    }

    /**
     * 初始化入口函数
     */
    function init() {
        // 初始化日期选择器
        initDatePicker()

        // 加载blacklist历史
        $timeout(function () {
            $scope.queryHistories()
        }, 0.5 * 1000)

        // 监听所有面板的选项中页面的变化
        TAB_IDS.forEach(function (tabID) {
            $scope.$watch(tabID + '.currentPage', function (newCurPage, old) {
                if (newCurPage == 1 && old == 1) return;
                $scope.queryHistories(newCurPage)
            })
        })
    }

    init()
})
