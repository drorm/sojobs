/*
* @module  sparrow.smodel models modal dialog to handle inserts and updates
*/

angular.module('sparrow.smodel')

/**
* Controller to set up the modal dialog to do an insert or update
*/
.controller('modalController', function ($scope, $http, formlyValidationMessages) {
   $scope.myForm = {};
  formlyValidationMessages.messages.date = '$viewValue + " is not a valid date"';
  formlyValidationMessages.addStringMessage('required', 'This field is required');
   if($scope.operationType === 'Update') {
     var row = $scope.row.entity;
     //Set up the current values of the fields 
    for (var field in row) {
      if(typeof(row[field]) !== 'function') {
        $scope.myForm[field] = row[field];
      }
    }
   }
})


.controller('insertUpdateController', ['$scope', '$uibModalInstance', 'result', 
  function($scope, $modalInstance, result) {
  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
  //Submit and insert or update
 $scope.submit = function (res) {
   console.log('result', res);
    var id = res.id;
   var row = new $scope.Model(res, {id:id});
    console.log('type:', $scope.operationType);
    if($scope.operationType === 'Update'){ //update
      row.$update(function(res){
        console.log('updated:', res);
        var rows = $scope.gridInfo.rows;
        //Display in the grid
        for(var ii = 0; ii < rows.length; ii++) {
          if(rows[ii].id === id) {
            rows[ii] = row;
            break;
          }
        }
        $modalInstance.close();
      },
      function(error){
        var err = error.data.error;
        console.log('Error:',err);
        alert(err.name + ':' + err.message);
      });
    } else { //insert
      //Save to the db
      row.$save(function(insertedRow){
        //Display in the grid
        $scope.gridInfo.rows.push(insertedRow);
        $modalInstance.close();
      },
      function(e){
        var err = e.data.error;
        console.log(e.data);
        alert(JSON.stringify(err.name + ':' + err.message));
      });
    }
  };
}]);

