app.controller('HistoryController', function ($q, $scope, $http, $rootScope, $location, $localStorage, $timeout,
                                              HttpService, ngDialog, alertMsgService) {

    TAB_IDS=["ipTab", "deviceTab", "defaultTab"];
    $scope.selectTabID = "ipTab"; //默认选中的标签为ip
    $scope.showip = true;

    $scope.pageSize = 3;
    /**
     * ip面板状态
     **/
    $scope.ipTab = {
        type: "ip",
        show: true,//显示
        histories: [],//历史数据
        total: 0,//总历史记录数
        currentPage: 1, //页面指针
    }

    /**
     * device面板状态
     **/
    $scope.deviceTab = {
        type: "device",
        show: false,//默认不显示
        histories: [],//历史数据
        total: 0,//总历史记录数
        currentPage: 1, //页面指针
    }

    /**
     * default面板状态
     **/
    $scope.defaultTab = {
        type: "default",
        show: false,//默认不显示
        histories: [],//历史数据
        total: 0,//总历史记录数
        currentPage: 1, //页面指针
    }

    /**
     * 上传黑名单对话框
     **/
    $scope.openUploadDlg = function () {
        let dlgOpts = {
            template: 'views/dlgs/upload-dlg.html',
            scope: $scope,
            controller: ['$scope', 'HttpService', function ($scope, HttpService) {
                $scope.selectFileName = "...";

                $scope.confirmActionText = "上传";
                $scope.upFlag = "blacklist";

                /**
                 * 文件改变
                 **/
                $scope.fileNameChanged = function (files) {
                    $scope.uploadFile = files[0];
                    $scope.selectFileName = $scope.uploadFile.name;
                    document.getElementById("labelSelectFile").innerText = $scope.selectFileName;
                }

                /**
                 * 选择上传类型
                 **/
                $scope.selectUploadFlag = function (upFlag) {
                    $scope.upFlag = upFlag;
                    switch (upFlag) {
                        case "blacklist":
                            $scope.confirmActionText = "上传";
                            break;

                        case "deleteList":
                            $scope.confirmActionText = "删除";
                    }
                }

                /**
                 * 上传黑名单
                 **/
                $scope.postBlacklist = function () {
                    if (!$scope.uploadFile) {
                        $scope.closeThisDialog();
                        alertMsgService.alert("请先选择文件", false);
                        return
                    }

                    var formData = new FormData();
                    formData.append('file', $scope.uploadFile);
                    formData.set("type", "device");

                    let payload = {
                        method: 'POST',
                        url: "/blacklist/uploadBlacklist",
                        data: formData,
                        headers: {'Content-Type': undefined},
                        transformRequest: angular.identity
                    }

                    $scope.closeThisDialog();
                    $http(payload)
                        .then(function (resp) {
                            data = resp.data;
                            if (data.success) {
                                alertMsgService.alert("提交成功", true);
                                $scope.queryHistories();
                            } else {
                                alertMsgService.alert("提交失败", false);
                            }
                        }).catch(function (err) {
                        alertMsgService.alert("提交失败", false);
                    })
                }
            }]
        }

        let uploadDlg = ngDialog.open(dlgOpts);
    }

    /**
     * 查询
     **/
    $scope.queryHistories = function (pageNO) {

        // 获取日期范围
        let dataRange = getDateRange();

        let selectedTabID = $scope.selectTabID;

        let payload = {
            type: $scope[selectedTabID].type,
            startDate: dataRange[0],
            endDate: dataRange[1],
            pageSize:$scope.pageSize
        }

        payload.pageNO=pageNO | $scope[selectedTabID].currentPage,

        HttpService.post("/blacklist/uploadHistories", payload)
            .then(function (respData) {
                if (respData.success) {
                    alertMsgService.alert("获取成功", true);
                    respData.data.forEach(function (row) { //转换时间戳
                        let date = new Date();
                        date.setTime(row.timestamp);
                        row.date = date.format("yyyy-MM-dd");
                    })

                    $scope[selectedTabID].histories = respData.data;
                    $scope[selectedTabID].total = respData.total;

                } else {
                    alertMsgService.alert("获取失败", false);
                    $scope[selectedTabID].histories = [];
                    $scope[selectedTabID].total = [];
                }

                if (!pageNO){
                    $scope[selectedTabID].currentPage=1;
                }
            });
    }

    /**
     * 退出
     **/
    $scope.logout = function () {
        HttpService.post("/auth/logout")
            .then(function (respData) {
                if (respData.success) {
                    return $location.path("/");
                }
                alertMsgService.alert("退出失败", false);
            })
            .catch(function (err) {
                alertMsgService.alert("退出错误", false);
            })
    }

    /**
     * 清空日期
     **/
    $scope.clearDate = function () {
        $scope.dateRange = "";
    }

    /**
     * 标签选择
     **/
    $scope.selectTab = function (tabID) {
        $scope.selectTabID = tabID;

        //隐藏所有面板
        TAB_IDS.forEach(function (tab) {
            $scope[tab].show = false;
        })

        // 显示指定面板
        $scope[tabID].show = true;

        if ($scope[tabID].histories.length == 0) { //无数据才查询
            //查询
            $scope.queryHistories();
        }
    }

    /**
     * 合并黑名单
     **/
    $scope.mergeBlacklist = function () {
        HttpService.post("/blacklist/mergeBlacklist", {type: $scope.selectTabID})
            .then(function (respData) {
                if (respData.success) {
                    alertMsgService.alert("合并成功", true);
                } else {
                    alertMsgService.alert("合并失败", false);
                }
            })
            .catch(function (err) {
                alertMsgService.alert("合并出错", false);
            })
    }

    /**
     * 初始化日期选择器
     **/
    function initDatePicker() {

        lay('#version').html('-v' + laydate.v);
        //执行一个laydate实例
        laydate.render({
            elem: '#date', //指定元素
            type: 'date',
            range: true
        });
    }

    /**
     * 获取日期范围
     **/
    function getDateRange() {
        let dataRange = document.getElementById("date").value;
        if (!dataRange) {  //默认查询最近一周的记录
            let nowDate = new Date();
            let endDateStr = new Date(nowDate.setDate(nowDate.getDate() + 1)).format("yyyy-MM-dd");
            let startDateStr = new Date(nowDate.setDate(nowDate.getDate() - 7)).format("yyyy-MM-dd");
            dataRange = [startDateStr, endDateStr];

        } else {
            dataRange = dataRange.split(" - ");
        }

        return dataRange;
    }

    /**
     * 初始化入口函数
     **/
    function init() {

        //初始化日期选择器
        initDatePicker();

        //加载ip历史
        $timeout(function () {
            $scope.queryHistories();
        }, 0.5 * 1000)

        $timeout(function () {
            // $scope.topTotal=5;
            // $scope.topPageSize=3;
        }, 2000);

        //监听所有面板的选项中页面的变化
        TAB_IDS.forEach(function (tabID) {
            $scope.$watch(tabID+".currentPage",function (newCurPage) {
                $scope.queryHistories(newCurPage);
            })
        })
    }

    init();
});