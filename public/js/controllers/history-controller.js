app.controller('HistoryController', function ($q, $scope, $http, $rootScope, $location, $localStorage,$timeout) {

    /**
     * 隐藏对话框
     **/
    $scope.hideDlgs=function() {
        $scope.showDlgBg=false;
        $scope.showUploadDlg=false;
    }

    /**
     * 显示对话框
     **/
    $scope.showDlg=function (targetFlag) {
        $scope.showDlgBg=true;
        $scope[targetFlag]=true;
    }

    /**
     *  提示
     **/
    var showStatusBar = function (isSuccStatus, tip) {
        $scope.showStatusBar = true;
        $scope.statusTip = tip;
        $scope.isSuccStatus = isSuccStatus;
        $scope.isErrStatus = !isSuccStatus;

        // 2 秒后消失
        $timeout(function () {
            console.log("xiaosih————>");
            $scope.showStatusBar = false;
        },3*1000);
    }

    /**
     * 初始化日期选择器
     **/
    function initDatePicker() {
        lay('#version').html('-v'+ laydate.v);
        //执行一个laydate实例
        laydate.render({
            elem: '#date' //指定元素
        });
    }

    /**
     * 初始化入口函数
     **/
    function init() {
        //初始化日期选择器
        initDatePicker();


    }
    init();
});