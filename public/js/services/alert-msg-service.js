angular.module('dif').service('alertMsgService', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
  $rootScope.alertMessages = []

  this.alert = function (msg, isGood) {
    if ($rootScope.alertMessages && $rootScope.alertMessages.length >= 1) {
      return
    }
    $rootScope.alertMessages.push({msg: msg, good: isGood})

    $timeout(function () {
      $rootScope.alertMessages.shift()
    }, 5000 * $rootScope.alertMessages.length)
  }
}])
