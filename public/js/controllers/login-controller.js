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
                    $location.path("/history");
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
});