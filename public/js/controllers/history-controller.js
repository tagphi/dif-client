app.controller('HistoryController', function ($q, $scope, $http, $rootScope, $location, $localStorage, $timeout,
                                              HttpService, ngDialog, alertMsgService) {

    /**
     * 上传黑名单对话框
     **/
    $scope.openUploadDlg = function () {
        let dlgOpts = {
            template: 'views/dlgs/upload-dlg.html',
            scope: $scope,
            controller: ['$scope', 'HttpService', function ($scope, HttpService) {
                $scope.selectFileName="...";

                $scope.confirmActionText = "上传";
                $scope.upFlag = "blacklist";

                /**
                 * 文件改变
                 **/
                $scope.fileNameChanged = function (files) {
                    $scope.uploadFile = files[0];
                    $scope.selectFileName=$scope.uploadFile.name;
                    document.getElementById("labelSelectFile").innerText=$scope.selectFileName;
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
                                // $scope.queryHistories();
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
    $scope.queryHistories = function () {

        // 获取日期范围
        let dataRange = getDateRange();

        let selectedTabID = $scope.tabID;


        let payload = {
            type: $scope.tabID,
            startDate: dataRange[0],
            endDate: dataRange[1]
        }

        $scope.$broadcast('event-pagination-query-'+$scope.tabID, payload);
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
        $scope.tabID = tabID;
        //取消所有选中
        ["showip", "showdevice", "showdefault"].forEach(function (showFlag) {
            $scope[showFlag] = false;
        })
        $scope["show" + tabID] = true;

        //查询
        $scope.queryHistories();
    }

    /**
     * 合并黑名单
     **/
    $scope.mergeBlacklist = function () {
        HttpService.post("/blacklist/mergeBlacklist", {type: $scope.tabID})
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
     * 初始化状态
     **/
    function initState() {
        $scope.tabID = "ip"; //默认选中的标签为ip
        $scope.showip = true;

    }

    /**
     * 初始化入口函数
     **/
    function init() {
        //初始化状态
        initState();

        //初始化日期选择器
        initDatePicker();

        //加载ip历史
        setTimeout(function () {
            $scope.queryHistories();
        },0.5*1000)
    }

    init();
});