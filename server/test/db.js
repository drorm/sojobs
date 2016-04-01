 var Db = require('../db/db.js'),
 assert = require('assert'),
 path = require('path'),
 app = require(path.resolve(__dirname, '../server')),
 db = new Db(app);

describe('Test db functionality', function() {
  it('should count the number of rows', function(done) {
    db.exec('select count(*) from listing')
    .then(function(result) {
      assert(result[0].count >= 0);
      done();
    });
  });

  it('should generate a syntax error', function(done) {
    db.exec('select count(* from listing')
    .then(function() {
      assert(false);//shouldn't get here
    }, function(err) {
      if (err) {
        done();
      }
    });
  });
});

