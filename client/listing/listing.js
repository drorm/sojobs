/* 
* @module -- sojobs.listing
* @description -- controller for showing a single listing
*
*/


angular.module('sojobs.listing', [])

/**
* Listing controller
*/
.controller('listingCtrl', ['$scope', '$http', '$sce', '$state', '$location','$stateParams', '$rootScope',
            'UtilsService', 
  function($scope, $http, $sce, $state, $location, $stateParams, $rootScope, UtilsService) {


        if($stateParams.id) {
        $scope.searchPromise = $http({
          url: '/listing?id=' + $stateParams.id,
          method: "GET",
        }).then(function (result, err) {
          if(result.data) {
            $scope.result = result.data.data[0];
          } else {
            console.log(err);
          }
        });
      }

      $scope.calcElapsed = function (datePosted) {
        return UtilsService.calcElapsed(datePosted);
      };
}])
/**
* Listing missing city controller
*/
.controller('missingCtrl', ['$scope', '$http', '$sce', '$state', '$location','$stateParams', '$rootScope',
            'UtilsService', 
  function($scope, $http, $sce, $state, $location, $stateParams, $rootScope, UtilsService) {


        $scope.searchPromise = $http({
          url: '/listing/missingCity',
          method: "GET",
        }).then(function (result, err) {
          console.log('res', result, err);
          if(result.data) {
            $scope.results = result.data.data;
          } else {
            console.log(err);
          }
        });

   /* 
   * when the user clicks on the title of a listing, show/hide that listing.
   */
   $scope.toggleDescription = function(index) {
     console.log('toggle:' + index + ':' + $scope.results[index].show);
     $scope.results[index].show = !$scope.results[index].show;
     if($scope.results[index].show) {
      var searchOptions = {
        types: ['(cities)'] //only show cities
      };
      console.log(index);
      var autocomplete = new google.maps.places.Autocomplete($('#missing' + index)[0], searchOptions);
       autocomplete.addListener('place_changed', function() {
         $scope['cityPicked' + index] = autocomplete.getPlace(); //When the user picks a city, populate it
       });
       }
     return(false);
   };

   $scope.submitCity = function(index, id) {
     var googleCity = $scope['cityPicked' + index];
     var location = {
       latitude: googleCity.geometry.location.lat(),
       longitude: googleCity.geometry.location.lng()
     };
     console.log('city:' + index,  $scope['cityPicked' + index], location, id);
     $http({
       url: "listing/addCity", 
       method: "POST",
       data: angular.element.param({
         location: location,
         id: id
       }),
       headers: {'Content-Type': 'application/x-www-form-urlencoded'}
     })
     .then(function(result) {
        $scope.alerts.push({type: 'info', msg: 'Inserted:' + googleCity.formatted_address});
        $scope.toggleDescription(index);
     })
     .catch(function(err) {
        $scope.alerts.push({type: 'alarm', msg: 'Insert failed:' + googleCity.formatted_address});
       console.log('insert failed', err);
     });

     return(false);
   };

   $scope.calcElapsed = function (datePosted) {
     return UtilsService.calcElapsed(datePosted);
   };
}]);
