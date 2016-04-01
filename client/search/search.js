/* 
* @module -- sojobs.search
* @description -- controller for searching for a job
*
*/


angular.module('sojobs.search', [])

/**
* Search controller
*/
.controller('homeCtrl', ['$scope', '$http', '$sce', '$state', '$location','$stateParams', '$rootScope', 
            'UtilsService', '$cookies',

  function($scope, $http, $sce, $state, $location, $stateParams, $rootScope, UtilsService, $cookies) {
            console.log('search controller');

     $scope.showResults = false; //initially only show search boxes

    // Set up the city autocomplete
    var searchOptions = {
      types: ['(cities)'] //only show cities
    };

    /*
    * Set up the distance HTML select
    */

   var distances = $scope.distances = [
        {id: 2, name: 'Within 2 miles'},
        {id: 5, name: 'Within 5 miles'},
        {id: 10, name: 'Within 10 miles'},
        {id: 25, name: 'Within 25 miles'},
        {id: 50, name: 'Within 50 miles'},
    ];

    var selectedDistance = $scope.distances[3]; //default 25

    if ($stateParams.distance) {
      for(var ii = 0; ii < distances.length; ii++) {
        if (distances[ii].id === parseInt($stateParams.distance)) {
          selectedDistance = distances[ii];
        }
      }
    }
    console.log($stateParams);

    //Set up the the default value in the select
    $scope.distance = {
      selected : { value: selectedDistance }
    };

    /*
    * Set up the Google places autocomplete for cities
    */
    var autocomplete = new google.maps.places.Autocomplete($('#searchCity')[0], searchOptions);
     autocomplete.addListener('place_changed', function() {
       $scope.search.cityPicked = autocomplete.getPlace(); //When the user picks a city, populate it
     });


      var prevQueries = $cookies.getObject('prevQueries');
      if(prevQueries) {
        prevQueries.splice(15, 10); //only show the last 20 searches
        $scope.prevQueries = prevQueries;
      } else {
        prevQueries = [];
      }
      console.log('prevQueries 2', prevQueries); 


     if($stateParams.location || $stateParams.search || $stateParams.visa || $stateParams.remote) {
      /*
      * Page is loaded with previous run.
      * Run the query and display the results.
      */
      $scope.runningSearch = true;
      if($stateParams.visa === 'false') {
        $stateParams.visa = undefined;
      }
      if($stateParams.remote === 'false') {
        $stateParams.remote = undefined;
      }
      
      // Set the cookie

       doSearch();
     }

    /*
    * Called on search form submission
    */
   $scope.jobSearch = function() {


     var googleCity = $scope.search.cityPicked; //The city the user picked as populated by the autocomplete
     var send = {
       q: $scope.search.query,
       visa: $scope.search.visa,
       remote: $scope.search.remote,
       distance: $scope.distance.selected.value.id
     }; //the search terms
     if(googleCity && googleCity.address_components) {
       //We get the city name, the coordinates, etc
       $scope.search.city = googleCity.address_components[0].short_name;
       send.location =  googleCity.formatted_address;
       send.latitude = googleCity.geometry.location.lat();
       send.longitude = googleCity.geometry.location.lng();
     } else if ($stateParams.latitude){ //city is pre-populated from previous search
       angular.extend(send, $stateParams);
       send.distance = $scope.distance.selected.value.id;
     } else {
       $scope.search.city = 'the world'; //not searching somewhere specific
     }
     console.log('query params', send);

     /*
     * We change the URL to match the search criteria, which makes this controller reload. When it reloads 
     * with the new params, it will do the actual search.
     * This is a little convoluted, but provides a URL that the user can save.
     */
     $location.search('search', send.q)
     .search('location', send.location)
     .search('latitude', send.latitude)
     .search('longitude', send.longitude)
     .search('visa', $scope.search.visa)
     .search('distance', send.distance)
     .search('remote', $scope.search.remote)
     //make the URL unique to trigger a browser refresh if they click the same query twice
     .search('unique', new Date().getTime()/1000);
   };


      /*
      * Do the actual http request to the server the form. 
      */
   function doSearch() {
     var params = {
       q: $stateParams.search,
       location: $stateParams.location,
       longitude: $stateParams.longitude,
       latitude: $stateParams.latitude,
       visa: $stateParams.visa,
       distance: $stateParams.distance,
       remote: $stateParams.remote
     };

    prevQueries.splice(0, 0, params);
    //don't save multiple runs of the same query
    prevQueries = _.uniqWith(prevQueries, _.isEqual);
    $cookies.putObject('prevQueries', prevQueries);
     console.log(params);

     $scope.searchPromise = $http({
       url: 'jobs/search',
       method: "GET",
       params: params
     });

/*
* Called on response from the server
* @param Object -- result: the result from the server
*/
     $scope.searchPromise.then(function (result, err) {
       console.log(result);
       if(result.data) {
         $scope.showResults = true;
         $scope.runningSearch = false;
         $scope.results = result.data.data.map(function(result) {
           result.title = $sce.trustAsHtml(result.title);
           result.desc = $sce.trustAsHtml(result.desc);
           return (result);
         });
         $scope.search.city = $stateParams.location;
         $scope.search.query = params.q;
         $scope.search.distance = params.distance;
         if(!params.location) {
           $scope.search.city = 'the world';
         }
         if(params.visa) {
           $scope.search.visa = true;
         }
         if(params.remote) {
           $scope.search.remote = true;
         }

       } else {
         console.log(err);
       }
     });
   }

   //display of elapsed time since listing
   $scope.calcElapsed = function (datePosted) {
     return UtilsService.calcElapsed(datePosted);
   };

   /* 
   * when the user clicks on the title of a listing, show/hide that listing.
   */
   $scope.toggleDescription = function(index) {
     $scope.results[index].show = !$scope.results[index].show;
     return(false);
   };

   $scope.saveSearch = function() {
     var params = {
       q: $stateParams.search,
       location: $stateParams.location,
       longitude: $stateParams.longitude,
       latitude: $stateParams.latitude,
       visa: $stateParams.visa,
       distance: $stateParams.distance,
       remote: $stateParams.remote
     };
     console.log('params', params);
     $http({
       url: "user/saveSearch", 
       method: "POST",
       data: angular.element.param({
         params: params
       }),
       headers: {'Content-Type': 'application/x-www-form-urlencoded'}
     })
     .then(function(result) {
        $rootScope.alerts.push({type: 'success', msg: 'Search saved'});
     })
     .catch(function(err) {
       $rootScope.alerts.push({type: 'alarm', msg: 'Failed save'});
       console.log('Save failed', err);
     });
   };

}]);
