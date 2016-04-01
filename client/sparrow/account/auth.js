/* 
* @module -- AuthService factory
* @description -- Handles all authentication mostly using built in loopback angular API
*
*/

angular.module('sparrow.account')
  .factory('AuthService', ['User', '$q', '$rootScope', '$http', function(User, $q, $rootScope, $http) {

    //Internal convenience method
    function setUserInfo(id, tokenId, first, last, email, isAdmin) {
          $rootScope.currentUser = {
            id: id,
            tokenId: tokenId,
            first: first,
            last: last,
            fullName: first + ' ' + last,
            email: email
          };
      $rootScope.isAdmin = isAdmin;
    }

    function login(email, password) {
      return User
        .login({email: email, password: password})
        .$promise
        .then(function(response) {
          setUserInfo(response.user.id, response.id, response.user.first, response.user.last, email, response.isAdmin);
          $rootScope.userId = User.getCurrentId();
          $rootScope.isAuthenticated = ($rootScope.userId !== null);
        });
    }

    function logout() {
      $rootScope.isAuthenticated = false;
      $rootScope.isAdmin = false;
      $rootScope.userId = null;
      $rootScope.currentUser = null;
      $rootScope.currentUser = null;
      delete $rootScope.appModels;

      return User
      .logout()
      .$promise;
    }

    function loggedIn() {
      var userId = User.getCurrentId();
      $rootScope.userId = userId;
      $rootScope.isAuthenticated = (userId !== null);
      if(userId !== null) {
        return User.getCurrent()
       .$promise
       .then(function(response) {
          setUserInfo(response.id, response.id, response.first, response.last, response.email, response.isAdmin);
       });
      } else {
        return $q.resolve(false); 
      }
    }

    function register(email, password, first, last) {
      return User
        .create({
         email: email,
         password: password,
         first: first,
         last: last
       })
       .$promise;
    }

    function sendResetPassword(email) {
      //Custom version so we can customize the email and URL

    return  $http({
        url: "resetPassword", //todo update to sendResetPassword
        method: "POST",
        data: angular.element.param({email: email}),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      });
    }

    function confirmRegistration(uid, token) {
      return User
        .confirm({
         uid: uid,
         token: token
       })
       .$promise;

    }

    function resetPassword(id, token, password) {
      $http.defaults.headers.common.authorization = token;
      
      return User
        .prototype$updateAttributes({id:id}, {
         password: password
       })
       .$promise;

    }

    return {
      login: login,
      logout: logout,
      loggedIn: loggedIn,
      confirmRegistration: confirmRegistration,
      sendResetPassword: sendResetPassword,
      resetPassword: resetPassword,
      register: register
    };
  }]);
