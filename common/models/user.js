var config = require('../../server/config.json');
var sparrowConfig = require('../../server/sparrowConfig.js');
var log = sparrowConfig.winston;
var path = require('path');

module.exports = function(user) {
  //send verification email after registration
  user.afterRemote('create', function(context, user, next) {

    var options = {
      type: 'email',
      to: user.email,
      from: sparrowConfig.emailFrom,
      subject: 'Thanks for registering with Sojobs.',
      template: path.resolve(__dirname, '../../server/views/verify.ejs'),
      verifyHref: 'http://' + config.host + ':' + config.port + 
        '/#/confirmRegistration?uid=' + user.id,
      restApiRoot: '/#/',
      user: user
    };

    user.verify(options, function(err, response) {
      if (err) return next(err);

      log.info('> verification email sent:', response);

      return context.res.json({result:'ok'});
    });
  });

  //send password reset link when requested
  user.on('resetPasswordRequest', function(info) {
    log.info('> user.resetPasswordRequest triggered');
    var url = 'http://' + config.host + ':' + config.port + '/#/resetPassword';
    var html = 'We have received a request to reset your password.<br>' +
      'If you have not requesed this, you can ignore this message.' +
      'Click <a href="' + url + '?id=' + info.accessToken.userId + '&access_token=' +
        info.accessToken.id + '">here</a> to reset your password';

    user.app.models.Email.send({
      to: info.email,
      from: sparrowConfig.emailFrom,
      subject: 'Password reset',
      html: html
    }, function(err) {
      if (err) return log.err('> error sending password reset email');
      log.info('> sending password reset email to:', info.email);
    });
  });

  /**
   * Return users by role
   * @param role
   * @param callback
   * From https://github.com/strongloop/loopback/issues/332
   */
  user.isAdmin = function(role, userId, callback) {

    var RoleMapping = user.app.models.RoleMapping;
    /**
   * Get user ID's by role name
   * @param role
   * @param callback
*/
    var usersIDByRole = function(role, callback){

      RoleMapping.app.models.Role.findOne({where: {name:role}}, function(err, role){
        if( err || !role ) return callback(err);
          RoleMapping.find({
            where: {
              roleId: role.id,
              principalType: RoleMapping.USER
            }
          }, function(err, mappings){
            if( err ) return callback(err);
              var users = mappings.map(function (m) {
                return m.principalId;
              });
              callback(null, users);
          });
      });
    };

    usersIDByRole(role, function(err, users) {

      if( err || !users ) return callback(err);
        if(users.indexOf(userId.toString()) === -1) {
          callback (null, false);
        } else {
          callback (null, true);
        }
    });
  };

  /**
   * Find the current user based on the token in the requst
   * @param Object: req -- the http request
   * @param function callback
   * @return object
   */
  user.getCurrent = function(req, callback) {
    if (!req.accessToken) {
        var error = 'You need to be logged in to do this';
        log.error(error);
        callback(error, null);
    }

    user.findById(req.accessToken.userId, function(err, foundUser) {
      if (err) {
        callback(err, null);
      }
      if (!foundUser) {
        var error = 'No user with this access token was found.';
        log.error(error);
        callback(error, null);
      }
        callback(null, foundUser);
    });
  };

  /*
  * A Remote hook to intercept the user info request and inject isAdmin true/false
  * TODO: migrate to just send back a list of roles the user belongs to
  */
  user.afterRemote('findById', function(context, userInfo, next) {
    var id = userInfo.id.toString();//result of the search is a string, so we need to convert here to find a match
    user.isAdmin( 'admin', id,  function(err, result) {
      context.result.isAdmin = result;
      next();
    });
  });

  /*
  * A Remote hook to intercept the login request and inject isAdmin true/false
  * TODO: migrate to just send back a list of roles the user belongs to
  */
  user.afterRemote('login', function(context, userInfo, next) {
    var id = userInfo.userId.toString();//result of the search is a string, so we need to convert here to find a match
    user.isAdmin( 'admin', id,  function(err, result) {
    context.result.isAdmin = result;
    console.log(context.result);
    console.log(context.result.created);
    console.log(context.result.id);
    next();
    });
  });
};
