/* global app */
'use strict'

var app = angular.module('dif', [
  'ngSanitize',
  'ui.bootstrap',
  'ngRoute',
  'ngFileUpload',
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
    .when('/job-history', {
      controller: 'JobHistoryController',
      templateUrl: 'views/job-history.html'
    })
    .when('/merges', {
      controller: 'MergesController',
      templateUrl: 'views/merges.html'
    })
}).run(function ($rootScope, $location) {
  $rootScope.$on('$routeChangeStart', function (evt, next, current) {
    let token = sessionStorage.getItem('token')
    if (!token) {
      // $location.path("/");
    }
  })
})
