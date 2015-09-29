/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var validator = require('validator');
var hat       = require('hat');

module.exports = {

  me: function(req, res, next){

    User
      .findOne({ id: req.user.id })
      .populateAll()
      .exec(function(err, user){
        if (err) return next(err);
        if (!user) return res.notFound();

        var passports = user.passports;
        var user = user.toJSON();

        user.passports = passports.map(function(passport){
          return passport.provider || passport.protocol;
        });

        UserToken
          .findOne({ user: user.id, type: 'email' })
          .exec(function(err, userToken){
            if (err) console.dir(err);

            if (userToken){
              user.newEmail = userToken.email;
            }

            res.json(user);
          });
      });
  },

  updateMe: function(req, res, next){
    var changedEmail = false;

    User
      .findOne({ id: req.user.id })
      .populateAll()
      .exec(function(err, user){
        if (err) return next(err);
        if (!user) return res.notFound();

        user.name = req.body.name || user.name;

        user.priority = req.body.priority || user.priority;
        user.priority2 = req.body.priority2 || user.priority2;
        user.priority3 = req.body.priority3 || user.priority3;

        user.leg = req.body.leg || user.leg;

        var changedSettings = user.settings;
        var dirtySettings = false;

        if (req.body.settings){

          var settings = [
            "emails",
            "invites",
            "groups_change",
            "groups_members",
            "meetings_create",
            "meetings_change",
            "meetings_states",
            "meetings_remove",
          ];

          settings.forEach(function(setting){
            if (req.body.settings.hasOwnProperty(setting)){
              user.settings[setting] = req.body.settings[setting];
              dirtySettings = true;
            }
          });
        }

        function saveUserAndGoOn(){
          user.save(function(err, user){
            if (err) return next(err);

            var passports = user.passports;
            var user = user.toJSON();

            user.passports = passports.map(function(passport){
              return passport.provider || passport.protocol;
            });

            user.settings = changedSettings;

            if (changedEmail){
              user.newEmail = changedEmail;
            }

            res.json(user);
          });
        }

        if (dirtySettings){
          user.settings.save(function(err, settings){
            changedSettings = settings;
            saveUserAndGoOn();
          });

          return;
        }

        // create a userToken with new email and set verified = false;
        if (req.body.email && validator.isEmail(req.body.email) && req.body.email !== user.email){
          // user has changed email

          function sendEmailAndGoOn(userToken){
            sails.services.email.sendEmailVerification(userToken, function(err){
              user.verified = false;
              changedEmail = userToken.email;
              
              saveUserAndGoOn();
            });
          }

          var oneWeek = 7 * 24 * 60 * 60 * 1000;
          var expire = new Date((new Date()).getTime() + oneWeek);

          UserToken
            .findOne({ user: user.id, type: 'email' })
            .populateAll()
            .exec(function(err, userToken){
              if (userToken){ //found a userToken already so update it
                userToken.email = req.body.email;
                userToken.expires = expire;
                userToken.save(function(err){
                  sendEmailAndGoOn(userToken);
                });

                return;
              }

              UserToken.create({
                user: user.id,
                type: 'email',
                email: req.body.email,
                token: hat(),
                expires: expire
              }, function(err, userToken){
                if (err) return next(null, false);
                userToken.user = user;
                sendEmailAndGoOn(userToken);
              });

            });

          return;
        }



          UserToken.create({
            user: user.id,
            type: 'email',
            email: req.body.email,
            token: hat(),
            expires: new Date((new Date()).getTime() + oneWeek)
          }, function(err, userToken){
            if (err) return next(null, false);
            userToken.user = user;

            sails.services.email.sendVerification(userToken, function(err){
              if (err) console.dir('error on change password - send email for user ' + uer.id);

              saveUserAndGoOn();
            });

          });

        saveUserAndGoOn();
      });
  },

  search: function(req, res, next){

    User
      .find()
      .where({ name: { contains: req.query.q } })
      .limit(10)
      .exec(function(err, users){
        if (err) return next(err);
        users = users || [];

        res.json(
          users.map(function(user){
            return _.pick(user, ['id', 'name', 'picture']);
          })
        );

      });
  },

  changePassword: function(req, res, next){
    var actual = req.body.actual;
    var change = req.body.change;

    Passport.findOne({
      protocol : 'local'
    , user     : req.user.id
    }, function (err, passport) {
      if (err) return next(err);

      if (!passport) {
        return res.notFound();
      }

      passport.validatePassword(actual, function (err, res) {
        if (err) {
          return next(err);
        }

        if (!res) {
          res.badRequest('Error.Passport.Password.Wrong');
        } else {
          passport.password = change;
          passport.save(function(err){
            if (err) return res.serverError();
            res.status(204);
            res.end();
          });
        }
      });

    });
  },

  sendEmailVerification: function(req, res, next){

    function sendEmail(userToken){
      sails.services.email.sendEmailVerification(userToken, function(err){
        if (err) return next(err);
        res.status(204);
        res.end();
      });
    }

    UserToken
      .findOne({ user: req.user.id, type: 'email' })
      .populateAll()
      .exec(function(err, userToken){
        if (err) return next(err);

        if (userToken){

          if (userToken.expires < (new Date())) {

            var oneWeek = 7 * 24 * 60 * 60 * 1000;
            userToken.expires = new Date((new Date()).getTime() + oneWeek);

            userToken.save(function(err, _userToken){
              if (err) return next(err);
              sendEmail(userToken);
            });

            return;
          }

          return sendEmail(userToken);
        }

        console.dir('no token found from a request to Verify email from UserId ' + req.user.id);
        next(new Error('verification not found'));
      });
  }

};
