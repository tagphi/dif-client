'use strict'

var app = angular.module('dif', [
  'ngSanitize',
  'ui.bootstrap',
  'ngRoute',
  'ngFileUpload',
  'nl2br',
  'ngStorage',
  'ngDialog'
]).config(function ($routeProvider) {
  $routeProvider
    .when('/', {
      controller: 'LoginController',
      templateUrl: 'views/login.html'
    })
    .when('/history', {
      controller: 'HistoryController',
      templateUrl: 'views/history.html'
    })
}).run(function ($rootScope, $location) {
  $rootScope.$on('$routeChangeStart', function (evt, next, current) {
    let token = sessionStorage.getItem('token')
    if (!token) {
      // $location.path("/");
    }
  })
})
