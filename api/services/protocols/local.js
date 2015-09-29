var validator = require('validator');
var crypto    = require('crypto');
var hat       = require('hat');
var gravatar = require('gravatar');

/**
 * Local Authentication Protocol
 *
 * The most widely used way for websites to authenticate users is via a username
 * and/or email as well as a password. This module provides functions both for
 * registering entirely new users, assigning passwords to already registered
 * users and validating login requesting.
 *
 * For more information on local authentication in Passport.js, check out:
 * http://passportjs.org/guide/username-password/
 */

/**
 * Register a new user
 *
 * This method creates a new user from a specified email, username and password
 * and assign the newly created user a local Passport.
 *
 * @param {Object}   req
 * @param {Object}   res
 * @param {Function} next
 */
exports.register = function (req, res, next) {
  var email    = req.param('email')
    , username = req.param('username')
    , password = req.param('password');

  if (!email) {
    req.flash('error', 'Error.Passport.Email.Missing');
    return next(new Error('No email was entered.'));
  }

  if (!username) {
    req.flash('error', 'Error.Passport.Username.Missing');
    return next(new Error('No username was entered.'));
  }

  if (!password) {
    req.flash('error', 'Error.Passport.Password.Missing');
    return next(new Error('No password was entered.'));
  }

  // MUST reachout database cause Waterline validation doesn't work
  User
    .findOne().where({ or: [{ username: username }, { email: email }] })
    .exec(function(err, found){
      if (err){
        req.flash('error', 'Error.Passport.Generic');
        return next(err);
      }

      if (found){
        if (found.username === username){
          req.flash('error', 'Error.Passport.User.Exists');
        }
        else {
          req.flash('error', 'Error.Passport.Email.Exists');
        }

        return next(err);
      }

      // otherwise > all good, create the user

      User.create({
        username : username
      , email    : email
      , name     : username
      , picture: gravatar.url(email, {s: '73'}) || ''
      }, function (err, user) {
        if (err) {
          if (err.code === 'E_VALIDATION') {
            if (err.invalidAttributes.email) {
              req.flash('error', 'Error.Passport.Email.Exists');
            } else {
              req.flash('error', 'Error.Passport.User.Exists');
            }
          }
          else {
            req.flash('error', 'Error.Passport.Generic');
          }

          return next(err);
        }

        // Generating accessToken for API authentication
        var token = crypto.randomBytes(48).toString('base64');

        Passport.create({
          protocol    : 'local'
        , password    : password
        , user        : user.id
        , accessToken : token
        }, function (err, passport) {
          if (err) {
            if (err.code === 'E_VALIDATION') {
              req.flash('error', 'Error.Passport.Password.Invalid');
            }

            return user.destroy(function (destroyErr) {
              next(destroyErr || err);
            });
          }

          // Set default user settings
          UserSettings.create({ user: user.id }, function (err, settings) {
            if (err) {
              return next(err);
            }

            user.settings = settings.id;
            user.save(function(err, u){
              if (err) {
                return next(err);
              }

              // send email verification and Welcome message

              var oneWeek = 7 * 24 * 60 * 60 * 1000;

              UserToken.create({
                user: user.id,
                type: 'email',
                email: email,
                token: hat(),
                expires: new Date((new Date()).getTime() + oneWeek)
              }, function(err, userToken){
                if (err) return next(null, false);
                userToken.user = user;

                sails.services.email.sendWelcome(userToken, function(err){
                  if (err) return next(err, user);
                  req.flash('success', 'Success.Passport.Welcome.CheckEmail');
                  next(null, user);
                });

              });

            });
          });

        });
      });

    });

};

/**
 * Recover password
 *
 *
 *
 * @param {Object}   req
 * @param {Object}   res
 * @param {Function} next
 */
exports.recover = function (req, res, next) {
  var email = req.param('email');

  function sendRecover(userToken){
    sails.services.email.sendRecover(userToken, function(err){
      if (err) return next(null, false);
      req.flash('success', 'Success.Passport.Recover.CheckEmail');
      return next();
    });
  }

  User.findOne({ email: email }, function (err, user) {
    if (err) {
      return next(err);
    }

    if (!user) {
      req.flash('error', 'Error.Passport.Email.NotFound');
      return next(null, false);
    }

    UserToken
      .findOne().where({ user: user.id, type: 'password' })
      .exec(function(err, userToken){
        if (err) {
          return next(null, false);
        }

        if (userToken){ // there is already a token

          var oneDay = 24 * 60 * 60 * 1000;
          userToken.expires = new Date((new Date()).getTime() + oneDay);
          userToken.save(function(err){
            if (err) return next(null, false);
            userToken.user = user;
            sendRecover(userToken);
          });

          return;
        }

        UserToken.create({
          user: user.id,
          type: 'password',
          token: hat()
        }, function(err, userToken){
          if (err) return next(null, false);
          userToken.user = user;
          sendRecover(userToken);
        });

      });

  });

};

/**
 * Assign local Passport to user
 *
 * This function can be used to assign a local Passport to a user who doens't
 * have one already. This would be the case if the user registered using a
 * third-party service and therefore never set a password.
 *
 * @param {Object}   req
 * @param {Object}   res
 * @param {Function} next
 */
exports.connect = function (req, res, next) {
  var user     = req.user
    , password = req.param('password');

  Passport.findOne({
    protocol : 'local'
  , user     : user.id
  }, function (err, passport) {
    if (err) {
      return next(err);
    }

    if (!passport) {
      Passport.create({
        protocol : 'local'
      , password : password
      , user     : user.id
      }, function (err, passport) {
        next(err, user);
      });
    }
    else {
      next(null, user);
    }
  });
};

/**
 * Validate a login request
 *
 * Looks up a user using the supplied identifier (email or username) and then
 * attempts to find a local Passport associated with the user. If a Passport is
 * found, its password is checked against the password supplied in the form.
 *
 * @param {Object}   req
 * @param {string}   identifier
 * @param {string}   password
 * @param {Function} next
 */
exports.login = function (req, identifier, password, next) {
  var isEmail = validator.isEmail(identifier)
    , query   = {};

  if (!password){
    req.flash('error', 'Error.Passport.Password.NotSet');
    return next(null, false);
  }

  if (isEmail) {
    query.email = identifier;
  }
  else {
    query.username = identifier;
  }

  User.findOne(query, function (err, user) {
    if (err) {
      return next(err);
    }

    if (!user) {
      if (isEmail) {
        req.flash('error', 'Error.Passport.Email.NotFound');
      } else {
        req.flash('error', 'Error.Passport.Username.NotFound');
      }

      return next(null, false);
    }

    Passport.findOne({
      protocol : 'local'
    , user     : user.id
    }, function (err, passport) {
      if (passport) {

        passport.validatePassword(password, function (err, res) {
          if (err) {
            return next(err);
          }

          if (!res) {
            req.flash('error', 'Error.Passport.Password.Wrong');
            return next(null, false);
          } else {
            return next(null, user);
          }
        });

        return;
      }

      req.flash('error', 'Error.Passport.Password.NotSet');
      return next(null, false);
    });
  });
};
