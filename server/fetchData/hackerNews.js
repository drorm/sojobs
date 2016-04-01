var request = require('request');
var path = require('path');
var async = require('async');
var app = require(path.resolve(__dirname, '../server'));
var Db = require('../db/db.js');
var config = require('../sparrowConfig.js');
var log = config.winston;
var htmlToText = require('html-to-text');
var sanitizeHtml = require('sanitize-html');
var Q = require('q');
var listing = app.models.listing; //listing model
var _ = require('lodash');

/* jshint camelcase:false */
var fetchJob = app.models.fetch_job;

var whoishiringUser = 'https://hacker-news.firebaseio.com/v0/user/whoishiring.json?print=pretty';
var itemUrl =  'https://hacker-news.firebaseio.com/v0/item/';
var itemUrlPostfix =  '.json?print=pretty'; 
var listingType = 'Hackernews';
var db = new Db(app);


var HnJob = function() {
  this.numFetched = 0; //Number of successfully fetched items
};

/*
* Hacker news API: https://github.com/HackerNews/API
*/

HnJob.prototype.run = function(mainCallback) {
  var self = this;

// Get postings by user whoishiring. 
  doRequest(whoishiringUser)
  .then( function(result) {
    //got through the listings of who's hiring and find the first one that has "Who is hiring"
    //THey're in reverse chronological order
    async.eachSeries(result.submitted, function(item, callback) {
      var url =  itemUrl + item + itemUrlPostfix;
      doRequest(url)
      .then( function(itemResult) {
        if (itemResult && itemResult.text) {
          if(itemResult.title.match('Ask HN: Who is hiring.*')) { //found it
            log.debug(itemResult.title);
            createFetchJob()
            .then (function(fetchJobRecord) {
              self.getMainPosting(itemResult, fetchJobRecord)
              .then(function() {
                //stored procedure: process the inserted listings: full text search, find city, visa, remote, et
                db.exec('select process_fetch_job($1)', [fetchJobRecord.id])
                  .then(function() {
                  });
                mainCallback(self.numFetched > 0); //Have we found any new postings?
                return;
              });
            });
          } else {
            callback(null, true);
          }
        }
      });
    });
  });



/**
 * @param {Object} posting -- the main posting with all the comments for jobs
 * @param {object} fetchJobRecord: the current job we're running
 *
 *  Example URL: 'https://hacker-news.firebaseio.com/v0/item/11012044.json?print=pretty';
 *  Example result:
 * {
 * "by" : "whoishiring",
 * "descendants" : 777,
 * "id" : 11012044,
 * "kids" : [ 11013154, 11013198, 11083331, 11080933, 11015176, 11012900, 11012882, 11012246, 11015081, 11015050, ...]
 * "score" : 454,
 * "text" : "Please lead with the location of the position and include the keywords\nREMOTE, ...
 * "time" : 1454338863,
 * "title" : "Ask HN: Who is hiring? (February 2016)",
 * "type" : "story"
 * }
*/
  HnJob.prototype.getMainPosting = function(posting, fetchJobRecord) {
    var self = this;

    var select = "select array(select original_id from listing where original_id = any ($1))";
    var deferred = Q.defer();
    db.exec(select, [posting.kids])
    .then(function(result) {
      var inserted = result[0].array;
      var newListings = _.difference(posting.kids, inserted);
      self.getListings(newListings, fetchJobRecord, function() {
        var updateInfo = {
          state: "DONE", 
          tried: newListings.length,  //number of items we tried to fetch
          finished: new Date(), //When we finished
          fetched: self.numFetched //actual number we fetched
        };

        fetchJobRecord.updateAttributes(updateInfo, function(err) {
          if (err) {
            log.error(err);
            return deferred.reject();
          } else {
            console.log(fetchJobRecord);
            deferred.resolve();
          }
        });
      });
    });

    return deferred.promise;
  };

/**
 * @description Get the individual listings and insert into the db
 * @param array items: the list of items we're fetching
 * @param object fetchJobRecord: the current job we're running
 * @param function cb: the callback
* Example URL: 'https://hacker-news.firebaseio.com/v0/item/11013154.json?print=pretty';
* Example result:
* {
* "by" : "snewman",
* "id" : 11013154,
* "kids" : [ 11013424, 11017171 ],
* "parent" : 11012044,
* "text" : "Ops Evangelist | S.F. Mid-Peninsula (on-site) | $130-180k, 0.5-1.5% equity<p>At Scalyr, we&#x27;ve built a log analysis ...",
* "time" : 1454346815,
* "type" : "comment"
* }
*/
  HnJob.prototype.getListings = function(items, fetchJobRecord, cb) {

    var self = this;

    //items = items.splice(0, 5); //Turn on for testing
    async.eachSeries(items, function(item, callback) {
      var url =  itemUrl + item + itemUrlPostfix;

      doRequest(url)
      .then( function(result) {
        if(!result.deleted) {
          var datePosted = result.time*1000; //Unix epoch in seconds, javascript in ms
          var description = sanitizeHtml(result.text);
          var title = result.text.replace((/<p>.*/), ''); //HN doesn't really have a title. We'll fake it by grabbing the first line
  title = title.substring(0, 150); //Next, make it no longer than 150 chars.
  if(title && title.length >= 150) { 
    title = title.replace((/\S*$/), ''); //And if it chopped a word in the middle, backtrack to the last white space
  }
  title = (htmlToText.fromString(title));//Finally, make the title text only
  log.debug(title);
  var insert = {
    created:new Date(), //when did we insert it: now 
    author: result.by, //who authored it
    date_posted: datePosted, //when was it posted/listed
    title: title, //see above
    description: description, //the actual text
    fetch_job_id:fetchJobRecord.id, //the fetchJob id our system. All listings in this run get the same job id
    original_id:result.id //the original id on hacker news
  };

  listing.create(insert, function (err) {
    if (err) {
      log.error(err);
      //Just log the error, don't abort the other runs
      callback();
    } else {
      self.numFetched++;
      console.log('inc', self.numFetched);
      callback();
    }
  });
        } else {
          log.debug(result.id + 'is deleted');
          callback();
        }
      })
      .catch(function(err) {
        console.log(err);
        callback();
      });
    }, function() { //Callback after eachSeries is done
      cb(); //call the main callback
    });
  };

  /*
  * Utility Functions
  * TODO: migrate to their own file
  */
 
/**
* @description Do a http request to fetch the data
* @param String: url -- the url to fetch
* @return the JSON of the result
*/

  function doRequest(url) {
    var req = {
      url: url,
      //provide a way for people to contact us
      headers: {'User-Agent': 'Mozilla/5.0 (compatible; http://sojobs.me, info@sojobs.me)'}
    };
      var deferred = Q.defer();

      request(req, function(err, response, body) {
        if(!err && response.statusCode !== 200) {
          err = 'HTTP status: ' + response.statusCode;
        }
        if (err) {
          log.error(err);
          return deferred.reject(err);
        }
        var result = JSON.parse(body);
        deferred.resolve(result);
      });
      return deferred.promise;
  }

/*
* Create a fetchJob row in the database where we store info about this run
*/

  function createFetchJob() {
    var deferred = Q.defer();

    fetchJob.create({created:new Date(), type:listingType, state: "RUNNING"}, function (err, result) {
      if (err) {
        log.error(err);
        return deferred.reject(err);
      } else {
        log.info('=== Started Job:' + result.created + '======');
        //and fetch the data
        deferred.resolve(result);
      }
    });
    return deferred.promise;
  }
};

module.exports = HnJob;
