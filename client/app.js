/* 
* @module -- sojobs. Main module for the So Jobs application
*
*/
var sojobs = angular.module('sojobs', [
  'ui.router', //General router
  'sparrow.account', //Sparrow acount module. Needs to be before ng-admin to set up the routes
  'ui.bootstrap', //Angular bootstrap
  'ui.bootstrap.modal',// for insert/update
  'sparrow.smodel', //Sparrow acount module. Needs to be before ng-admin to set up the routes
  'ngAnimate', //Used by Angular bootstrap
  'ui.grid', //grid to display data
  'ngMessages',
  'cgBusy', //busy indicator
  'ui.gravatar', //Gravatar images
  'formlyBootstrap', //Insert and update
  'formly', //Insert and update
  'angular-confirm', //Insert and update
  'lbServices', //Used for communicating to the loopback server
  'ngCookies', //to save previous searches
  'ngSanitize', //sanitize the HTML
  'sojobs.search',//our search module
  'ui.select', //distance drop down
  'sojobs.listing'
])
//set up some defaults for the app
.constant('sparrowConfig', {
  apiUrl: '/api/'
})
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
'use strict';

//Set up the routes for the application
// '/dashboard' takes you to the ng-admin dashboard
  $stateProvider
  .state('home', {
    url: '/?search&location&latitude&longitude&visa&remote&distance&unique', 
    templateUrl: 'home.html',
    controller: 'homeCtrl'
  })
  .state('login', {
    url: '/login', 
    templateUrl: 'sparrow/account/login.html',
    controller: 'loginCtrl'
  })
  .state('pleaseLogin', {
    url: '/pleaseLogin', 
    templateUrl: 'sparrow/account/pleaselogin.html'
  })
  .state('resetPassword', {
    url: '/resetPassword', 
    templateUrl: 'sparrow/account/resetPassword.html',
    controller: 'resetCtrl'
  })
  .state('forgotPassword', {
    url: '/forgotPassword', 
    templateUrl: 'sparrow/account/forgot.html',
    controller: 'forgotCtrl'
  })
  .state('confirmRegistration', {
    url: '/confirmRegistration', 
    templateUrl: 'sparrow/account/confirm.html',
    controller: 'confirmCtrl'
  })
  .state('listing', {
    url: '/listing?{{id}}', 
    templateUrl: 'listing/listing.html',
    controller: 'listingCtrl'
  })
  .state('missing', {
    url: '/missing', 
    templateUrl: 'listing/missing.html',
    controller: 'missingCtrl'
  })
  .state('signup', {
    url: '/signup', 
    templateUrl: 'sparrow/account/signup.html',
    controller: 'signupCtrl'
  })
  .state('profile', {
    url: '/profile', 
    templateUrl: 'sparrow/account/profile.html',
    controller: 'signupCtrl'
  })
  .state('modelDetail', {
    url: '/models?name',
    templateUrl: 'sparrow/dash/smodel-detail.html',
    controller: 'SmodelDetailCtrl'
  })

;


}])

.controller('sidebarController', ['$rootScope', '$scope', function($rootScope, $scope) {
  $scope.showTreeItem = true;
  $scope.togglTree = function() {
    $scope.showTreeItem = !$scope.showTreeItem;
  };
}])
.run(['AuthService', '$rootScope', '$location', '$state', '$http', 'User', '$window','ModelService',
     function(AuthService, $rootScope, $location, $state, $http, User, $window, ModelService) {
 
 ModelService.init();
  //set up alert array
  $rootScope.alerts = [
  ];

  $rootScope.closeAlert = function(index) {
    $rootScope.alerts.splice(index, 1);
  };

  var loggedIn = AuthService.loggedIn()
  .then(function() {
    console.log('loggedin user:', loggedIn);
    console.log('Current user:', $rootScope.currentUser);
    console.log('isAdmin:', $rootScope.isAdmin);
  }); //Check and see if the user is logged in: affects menus


  //Set up some defaults
  $rootScope.pleaseLoginMessage = 'Please Login';
  $rootScope.pleaseLoginButton = 'Login';

  //TODO: move to header controller
  $rootScope.logout = function() {
    $rootScope.pleaseLoginMessage = 'You are now logged out of your account.';
    $rootScope.pleaseLoginButton = 'Log back in';
    $rootScope.userId = undefined;
    AuthService.logout()
    .then(function() {
      $state.go('pleaseLogin');
      $window.location.reload();
    })
    .catch(function() {
      $state.go('pleaseLogin');
    });
};

  //TODO migrate to a service

//https://github.com/almasaeed2010/AdminLTE/issues/838

    $('input').iCheck();
    function checkMainFooter() {
        var height = $(".main-footer").outerHeight();
        if (height == null) {
            setTimeout(checkMainFooter, 100);
            return;
        } else {
          $.AdminLTE.layout.fix();
        }

    }

    checkMainFooter();
}]);
