/*
* Fetch data from jobs web site and import it into our system
*/


var config = require('../sparrowConfig.js');
var log = config.winston;

var MINUTE = 60*1000; 
var HOUR = 60*MINUTE; 
var DAY = 24*HOUR; 

var minInterval = 5*MINUTE;
var maxInterval = DAY;
var currentInterval = 10*MINUTE; //Start with 10 minutes
var HnJob = require('./hackerNews.js');



/*
* Run the fetch jobs at a specific interval.
* If we find data, we half the interval, if we don't we double it.
* Maximum every 5 minutes, minimum once a day.
*/
  runFetchJobs();

  function runFetchJobs() {

    /* for debugging.
    var found = false;
    if(rand > 0.5) {
    found = true; //we found it
    } else {
    }
*/

    var hnJob = new HnJob();
    hnJob.run(function(found) {

      log.debug('Found new:' + found);

      if (found) {
        currentInterval /= 2; //half the time
      } else {
        currentInterval *= 2; //double the time
      }

      if(currentInterval > maxInterval) {
        currentInterval = maxInterval;
      } 
      if(currentInterval < minInterval) {
        currentInterval = minInterval;
      } 
      log.debug(found, currentInterval);
      setTimeout(runFetchJobs, currentInterval);
    });
  }
