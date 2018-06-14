angular.module('dif').directive('alertMsg', function () {
  return {
    restrict: 'AE',
    scope: {
      alertMessages: '='
    },
    templateUrl: 'views/alerts/top-msg-alerts.html'
  }
})
