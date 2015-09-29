/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

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

        res.json(user);
      });
  },

  updateMe: function(req, res, next){

    User
      .findOne({ id: req.user.id })
      .populateAll()
      .exec(function(err, user){
        if (err) return next(err);
        if (!user) return res.notFound();

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

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

};
