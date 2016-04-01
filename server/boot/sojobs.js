module.exports = function(app) {
  //  var listing = app.models.listing; //listing model
  var db = app.dataSources.db;
  var config = require('../sparrowConfig.js');
  var log = config.winston;
  var Db = require('../db/db.js');
  var dbObj = new Db(app);


  /**
   * Get the list of models in the app and their properties
   * Filters out system models 
   * TODO: Should only show models that the user had Read permissions on
*/

  //Search for a job
  app.get('/jobs/search',  function(req, res) {
    var query = req.query;
    var searchQuery = query.q;
    var locationString = '';
    var visaString = '';
    var searchString = '';

    /* 
    * Handle various constraints 
*/
    var queryParams = [];

    var searchRequest = '';
    if(searchQuery) { //If there's a search string
      searchRequest = searchQuery.replace(/\s+/g, '|'); 
      searchString = " and ts_rank(to_tsvector('english', description),  to_tsquery($1))  > 0.05 ";
    } else {
      searchString = ''; //No search string
    }
    queryParams.push(searchRequest);

    //set the location and distance
    if(query.latitude && query.longitude) { //If there's a location
      queryParams.push(query.longitude);
      queryParams.push(query.latitude);
      queryParams.push(query.distance);
      locationString = " and ((geo_distance(point($2, $3), loc) < $4 ";
                               if(query.remote) { //If remote is true
                                 locationString += ' ) or remote = true)';
                               } else {
                                 locationString += ' )) ';
                               }
    }

    //only listings that handle visa
    if(query.visa) {
      visaString = ' and visa is true ';
    }

    //TODO: Move to db module
    var select = "SELECT distinct ts_rank(to_tsvector('english', description),  to_tsquery($1)) " + 
      " as relevancy, id, description as desc, title, visa, remote, city, date_posted, original_id" +
        "  from listing_loc where description is not null" + 
          locationString + visaString + searchString + 
            " order by 1 desc limit 100";
    log.debug(select, queryParams);
    db.connector.execute(select, queryParams, function(err, results) {
      if(err) {
        log.error(err);
        return res.status(500).json({err:err});
      } else {
        return res.json({data:results, err:null});
      }
    });
  });

  //display a signle listing
  app.get('/listing',  function(req, res) {
    var id = req.query.id;

    if (!id) {
      return res.json({err:'No id passed'});
    } else {
      //TODO: Move to db module
      var select = "SELECT distinct id, description as desc, title, visa, remote, city, date_posted, original_id" +
        "  from listing_loc where id = $1";
      log.debug(select, id);

      db.connector.execute(select, [id], function(err, results) {
        if(err) {
          log.error(err);
          return res.status(500).json({err:err});
        } else {
          if(results) {
            return res.json({data:results, err:null});
          } else {
            return res.json({data:'', err:err});
          }
        }
      });
    }
  });

  //Get the listings that have no city associated with them and are not marked "remote"
  app.get('/listing/missingCity',  function(req, res) {

    if (!req.accessToken) {
        var error = 'You need to be logged in to do this';
        log.error(error);
        return res.json({data:'', err:error}); 
    }

    app.models.User.getCurrent(req, function(err, user) {
      if (err) {
        return res.json({data:'', error: err}); 
      }
      app.models.User.isAdmin( 'admin', user.id,  function(err, isAdmin) {
        if(!isAdmin) {
          var error =  'You do not have permission to do this.';
          log.error(error, 'No admin user id', user.id);
          return res.json({data:'', error: error}); 
        }

        var select = "select * from listing where id not in (select listing_id from listing_city) and remote is not true";

        dbObj.exec(select)
        .then(function(results) {
          return res.json({data:results, err:null});
        })
        .catch(function(err) {
          log.error(err);
          return res.json({data:'', err:err}); 
        });

      });

    });


  });
  
  //Add a city to a listing
  app.post('/listing/addCity',  function(req, res) {
    if(!(req.body && req.body.location && req.body.id)) {
      return res.json({err:'Missing location or listing id'});
    } else {
      var insert = 'insert into listing_city select geonames_id, $1 from city where geo_distance(location, point($2, $3 )) < 1';
      var params = [req.body.id, req.body.location.longitude, req.body.location.latitude ];

      dbObj.exec(insert, params)
      .then(function(results) {
        return res.json({data:results, err:null});
      })
      .catch(function(err) {
        log.error(err);
        return res.json({data:'', err:err}); 
      });
    }

  });
  //
  //Add a city to a listing
  app.post('/user/saveSearch',  function(req, res) {
    var subscription = app.models.subscription; //subscription model
    console.log('body', req.body);
    if(!(req.body && req.body.params)) {
      return res.json({err:'Missing params'});
    }
    app.models.User.getCurrent(req, function(err, user) {
      if (err) {
        return res.json({data:'', error: err}); 
      }
      var insert = {
        search:req.body.params,
        owner: user.id
      };

      subscription.create(insert, function (err) {
        if (err) {
          console.log('error');
          res.json({err:err, date:null});
        } else {
          console.log('no error');
          res.json({err:null, data:'OK'}); 
        }
      });
    });
  });
};
