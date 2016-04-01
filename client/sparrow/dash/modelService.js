/* 
* @module -- ModelsService factory
* @description -- Provides information about models
*
*/

angular.module('sparrow.smodel')
.factory('ModelService', ['User', '$q', '$rootScope', '$http', function(User, $q, $rootScope, $http) {

  var getModels = function () {
    if(!$rootScope.currentUser) {
      return;
    }
    var defer = $q.defer();
    $http.get('/sparrow/models').success(function(data) {
      if(!$rootScope.isAdmin) {
        //Only admin can see user data. Security is implemented on the server, 
        //Here, we just hide the link to the menu
        delete data.user;
      }
      $rootScope.appModels = data;
      defer.resolve(data);
    })
    .error(function(data, status, headers, config) {
      defer.reject(status);
    });

    return defer.promise;
  };

  function init() {
    $rootScope.$watch('currentUser', function(newValue, oldValue) {
      getModels();
    });
  }

  return {
    getModels: getModels,
    init: init
  };

}]);
