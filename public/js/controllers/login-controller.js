app.controller('LoginController', function ($q, $scope, $http, $rootScope, $location, $localStorage) {
    $scope.login = function() {
        if (!$scope.loginForm.$valid) {
            return
        }

        var username = $scope.username;
        var password = $scope.password;

        var loginUrl = '/auth/login';

        $http.post(loginUrl, {'username': username, 'password': password})
            .then(
            function(response) {
                var data = response.data;
                if (data.success === true) {
                    $location.path("/admin");
                    sessionStorage.setItem("token",response.data.token);
                } else {
                    $scope.errmsg = data.message;
                    alert(data.message);
                }
            }, function(response) {
                $scope.errmsg = "请检查网络";
            }
        );
    }

    /**
     *  检查表单
     **/
    function checkForm() {
        var username = $scope.username;
        var password = $scope.password;

        // 验证用户名
        if (isEmpty(username)){
            showUserErr(true,"请输入有效的用户名");
            return false;
        }else {
            showUserErr(false,"");
        }

        //验证密码
        if (isEmpty(password)) {
            showPasswdErr(true,"请输入密码");
            return false;
        }else {
            showPasswdErr(false,"");
        }

        return true;
    }

    /**
     *  是否为空字符
     **/
    function isEmpty(str) {
        if (!str || str.length == 0){
            return true;
        }
        return false;
    }


    /**
     *  显示或隐藏用户名提示
     **/
    function toggleUsernameErrTip(show,tip) {
        $scope.showUserErr=show;
        $scope.userErr=tip;
    }

    /**
     *  显示或隐藏密码提示
     **/
    function togglePasswdErrTip(show,tip) {
        $scope.showPasswdErr=show;
        $scope.passwdErr=tip;
    }
});