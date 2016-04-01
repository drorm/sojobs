/* 
* @module -- sparrow.account
* @description -- controllers for all the account related operations: login, logout, signup, forgot password
*
*/

//Style the checkboxes
function fixCheckboxes() {
  $('input').iCheck({
    checkboxClass: 'icheckbox_square-blue',
    radioClass: 'iradio_square-blue',
    increaseArea: '20%' // optional
  });
}

angular.module('sparrow.account', [])

//Doesn't have to do with auth, but need to set the routing before ng-admin is loaded so it doesn't take over 
//the defaults TODO: move it somwhere else
.config(['$urlRouterProvider', 
        function ($urlRouterProvider) {

    $urlRouterProvider.when('', '/');
    $urlRouterProvider.otherwise("/");
  }])

/**
* Signup controller
*/
  .controller('signupCtrl', ['$scope', 'AuthService', '$state',  '$rootScope',
    function($scope, AuthService, $state, $rootScope) {

    fixCheckboxes(); 

      $scope.register = function() {
        AuthService.register($scope.user.email, $scope.user.password, $scope.user.first, $scope.user.last)
        .then(function() {
          $scope.signupError = false;
          $rootScope.userId = undefined;
          $rootScope.pleaseLoginMessage = 'Check your email.';
          $rootScope.pleaseLoginButton = 'Please login';
          $state.go('pleaseLogin');
        })
        .catch(function(err) {
          $scope.signupError = err;
          console.log(err);
        });
};
}])
/**
* Login controller
*/
.controller('loginCtrl', ['$scope', 'AuthService', '$state',
    function($scope, AuthService, $state) {

    fixCheckboxes(); 

    $scope.login = function() {
      $scope.loginError = false;
      $scope.loginPromise =  AuthService.login($scope.user.email, $scope.user.password);
      $scope.loginPromise.then(function() {
        $scope.loginError = false;
        $state.go('home');
      })
      .catch(function() {
        $scope.loginError = true;
      });
    };
}])
/**
* Forgot password controller
*/
.controller('forgotCtrl', ['$scope', 'AuthService', '$state', '$rootScope',
    function($scope, AuthService, $state, $rootScope) {

      console.log('forgot');
      $scope.forgot = function() {
        AuthService.sendResetPassword($scope.user.email)
        .then(function() {
          console.log('forgot success');
          $scope.loginError = false;
          $rootScope.pleaseLoginMessage = 'Check your email';
          $rootScope.pleaseLoginButton = 'Then login';
          $state.go('pleaseLogin');
        })
        .catch(function(err) {
          console.log('reset failed', err);
          $scope.forgotError = err;
        });
      };
}])
/**
* Confirm email address controller
*/
.controller('confirmCtrl', ['$location', 'AuthService', '$state', '$rootScope',
    function($location, AuthService, $state, $rootScope) {

      var uid = $location.search().uid;
      var token = $location.search().token;
      console.log('confirm', uid, token);
        AuthService.confirmRegistration(uid, token)
        .then(function() {
          $rootScope.confirmMessage = 'You are now registered';
          $rootScope.pleaseLoginButton = 'Please login';
          $rootScope.confirmError = false;
        })
        .catch(function(err) {
        $rootScope.confirmError = true;
          $rootScope.confirmMessage = '';
          $rootScope.pleaseLoginButton = "Can't login";
          console.log('confirm failed', err);
        });
}])
/**
* Change password after reset controller
*/
.controller('resetCtrl', ['$location', 'AuthService', '$scope', '$rootScope', '$state',
    function($location, AuthService, $scope, $rootScope, $state) {

      $scope.reset = function() {
        var uid = $location.search().id;
        var token = $location.search().access_token;
        console.log('reset', uid, token);
        AuthService.resetPassword(uid, token, $scope.user.password)
        .then(function() {
          $rootScope.confirmMessage = 'Your password has been updated';
          $rootScope.pleaseLoginButton = 'Please login';
          $rootScope.confirmError = false;
          $state.go('pleaseLogin');
        })
        .catch(function(err) {
          $rootScope.confirmError = true;
          $rootScope.confirmMessage = 'Your password update has failed';
          $rootScope.pleaseLoginButton = "Can't login";
          console.log('update failed', err);
        });
      };
}])
;
