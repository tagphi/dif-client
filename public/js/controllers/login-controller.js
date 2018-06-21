app.controller('LoginController', function ($q, $scope, $http, $rootScope, $location, $localStorage) {

    $scope.errors={
        username:false,
        password:false
    }
    $scope.login = function () {

        var username = $scope.username
        var password = $scope.password

        if (!username || username.length == 0) {
            $scope.errors.username = true;
            return
        }

        if (!password || password.length == 0) {
            $scope.errors.password = true;
            return
        }

        var loginUrl = '/auth/login'

        $http.post(loginUrl, {'username': username, 'password': password})
            .then(function (response) {
                    var data = response.data
                    if (data.success === true) {
                        $location.path('/history')
                        sessionStorage.setItem('token', response.data.token)
                    } else {
                        $scope.errmsg = data.message
                        alert(data.message)
                    }
                }
            ).catch(function (response) {
            $scope.errmsg = '请检查网络'
        })
    }
})
