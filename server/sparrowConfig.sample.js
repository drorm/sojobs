var winston = require('winston');

////  Customize These ////
var config = {
  autoUpdate: false, //On startup update the database whenever the model is changed in Loopback
  initAdmin: {
    email: 'jane@yourdomain.com',
    first: 'Jane',
    last: 'Doe',
    password: 'XXXXXXXXXXXXXX'
  },
  emailFrom: "postmaster@yourdomain.com", //who are the emails coming from
  sysModels : [ //Don't display system models. They need to be handled specially. Change at your own risk
    'Email',
    'AccessToken',
    'ACL',
    'Role',
    'RoleMapping'
  ]
};
////  End of Customize These ////

/**
 * Default logging for dev is "debug" and for production is "info"
 *
 * @method winston
 */
config.winston = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ level: 'debug', colorize:true, timestamp:true }),
  ]
});

module.exports = config;
