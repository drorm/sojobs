var config = require('../sparrowConfig.js');
var log = config.winston;
var Q = require('q');

module.exports = function(app) {
  this.db = app.dataSources.db;

  
  
  this.exec = function(query, params) {
    var deferred = Q.defer();
    log.debug(query);
    this.db.connector.execute(query, params, function(err, results) {
      if(err) {
        log.error(err);
        return deferred.reject(err);
      } else {
        //log.debug(results);
        deferred.resolve(results);
      }
    });
    return deferred.promise;
  };
};
