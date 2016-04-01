/*
* Custom bootup sparrow module, runs on server startup
*/

var path = require('path');
var async = require('async');
var app = require(path.resolve(__dirname, '../server'));
var config = require('../sparrowConfig.js');
var log = config.winston;
var User = app.models.user;
var Role = app.models.Role;
var RoleMapping = app.models.RoleMapping;


if(config.autoUpdate) {
  autoUpdate();
}

if(config.initAdmin) {
  initAdmin();
}

function autoUpdate() {
  var ds = app.dataSources.db;
  var arrModels = Object.keys(ds.adapter._models);

  log.debug('Automigrating:' +  arrModels);

  async.eachSeries(arrModels, function(model, cb) {
    'use strict';
    log.debug('migrate:' +  model);
    ds.autoupdate(model, function(err) {
      if (err)  {
        log.error(err);
      }
      else  {
        log.debug('automigrated:' + model);
      }
      cb();


    });
  });
}


function initAdmin() {
  //Create the admin user
  User.create([
    {email: config.initAdmin.email, password: config.initAdmin.password, first: config.initAdmin.first, last: config.initAdmin.last, emailVerified: true}
  ], function(err, users) {
    if (err) {
      if(err[0].statusCode === 422) {
        if(err[0].details.codes.email && err[0].details.codes.email[0] === 'uniqueness') {
          log.debug('user:' + config.initAdmin.email + ' already exists.');
        } else {
          log.debug(err, err[0].details); 
        }
        return; //assume all the rest was done
      } else {
        log.error(err);
        throw err;
      }
    }
    
    // Now let's create the admin role, and assign the user with this role
    Role.create({
      name: 'admin'
    }, function(err, role) {
      if (err) {
        throw err;
      }


      //make the user an admin
      role.principals.create({
        principalType: RoleMapping.USER,
        principalId: users[0].id
      }, function(err) {
        if (err) {
          log.error(err);
          throw err;
        }

      });
    });
  });

}
