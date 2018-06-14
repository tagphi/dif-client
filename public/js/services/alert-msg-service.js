angular.module('dif').service('alertMsgService', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
    $rootScope.alertMessages = []

    this.alert = function (msg, isGood) {

        if ($rootScope.alertMessages && $rootScope.alertMessages.length>=1){
            return;
        }
        $rootScope.alertMessages.push({msg: msg, good: isGood})

        $timeout(function () {
            var x = $rootScope.alertMessages.shift()
        }, 3000 * $rootScope.alertMessages.length)
    }
}])
