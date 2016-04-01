var _ = require('lodash');
var config = require('../sparrowConfig.js');
var log = config.winston;
module.exports = function(app) {
  var User = app.models.user;


  //send an email with instructions to reset an existing user's password
  app.post('/resetPassword',  function(req, res) {
    User.resetPassword({
      email: req.body.email
    }, function(err) {
      if (err) {
        return res.status(401).send(err);
      }
      return res.json({result:'ok'});
    });
  });

 /**
   * Get the list of models in the app and their properties
   * Filters out system models 
   * TODO: Should only show models that the user had Read permissions on
   */

  app.get('/sparrow/models', function(req, res) {
 /**
   * Copied from loopback explorer
   * Given a propType (which may be a function, string, or array),
   * get a string type.
   * @param  {*} propType Prop type description.
   * @return {String}     Prop type string.
   */
    function getPropType(propType) {
      if (typeof propType === 'function') {
        // See https://github.com/strongloop/loopback-explorer/issues/32
        // The type can be a model class
        return propType.modelName || propType.name.toLowerCase();
      } else if (Array.isArray(propType)) {
        return 'array';
      } else if (typeof propType === 'object') {
        // Anonymous objects, they are allowed e.g. in accepts/returns definitions
        return 'object';
      }
      return propType;
    }

    var schema = {};
    var models = app.models();

    models.forEach(function(model) {
      var name = model.modelName;
      if (_.includes(config.sysModels, name)) {
        log.debug('skip', name) ;
      } else {
        var modelDetails = app.loopback.findModel(name);
        //Clone the properties so we don't mess them up when we stringify the type
        var originalProps = modelDetails.definition.properties;
        var props = JSON.parse(JSON.stringify( originalProps));

        Object.keys(props).forEach(function(key) {
          var prop = props[key];
          prop.type = getPropType(originalProps[key].type);
        });
        schema[name] = props;
      }
    });

    res.send(schema);
  });
};
