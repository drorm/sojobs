/* 
* @module -- utils factory
* @description -- General utilities
*
*/

angular.module('sojobs')
  .factory('UtilsService', [function(User, $q, $rootScope, $http) {

      /**
      * Internal function, not exposed
      * display day/days, minute/minutes, etc based on the number
      * @param {Number} datePosted
      * @param {String} Unit
      */
        var pluralize = function(val, unit) {
          val = val.toString();
          var niceVal = val;
          niceVal += " ";
          niceVal += unit;
          if (val.substring(val.length - 1) === "1") {
            if (val.substring(val.length - 2) === "11") {
              niceVal += "s";
            }
          } else {
            niceVal += "s";
          }
          return niceVal;
        };


      /*
      * Instead of displaying a timestamp, display something like "posted 2 days ago"
      * @param -- Date: datePosted
      */
      var calcElapsed = function (datePosted) {

        //Borrowed from https://github.com/drorm/thishood/blob/a87f18d4771a13d772a31618d59c06c31cfabf14/web-app/js/thishood/stream/stream.js which adapted it from Stackoverflow


        var delta = (new Date().getTime() - new Date(datePosted).getTime())/1000;

        if (delta < 60) {
          return "less than a minute";
        } else if (delta < 120) {
          return "about a minute";
        } else if (delta < 2700) {
          return pluralize(Math.round(delta / 60), "minute");
        } else if (delta < 5400) {
          return "about an hour";
        } else if (delta < 86400) {
          return "about " + pluralize(Math.round(delta / 3600), "hour");
        } else {
          return pluralize(Math.round(delta / 86400), "day");
        }


      };
    return {
      calcElapsed: calcElapsed
    };
  }]);
