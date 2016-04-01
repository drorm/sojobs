var loopback = require('loopback');
var boot = require('loopback-boot');
var bodyParser = require('body-parser');
var config = require('./sparrowConfig.js');
var log = config.winston;

var app = module.exports = loopback();

// configure body parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(loopback.token());
app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    log.info('Web server listening at: %s', app.get('url'));
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) {
    throw err;
  }

  // start the server if `$ node server.js`
  if (require.main === module) {
    app.start();
  }
});
