/**
 * VerifyController
 *
 * @description :: Server-side logic for managing Verifies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  verifyInvite: function(req, res){
    req.session.redirect = '';

    if (req.session.authenticated){

      async.waterfall([

        function(done){ // find the invite
          Invite
            .findOne({ token: req.params.token })
            .populateAll()
            .exec(done);
        },

        function(invite, done){ // validate invite
          if (!invite) return done('not-found');

          var today = new Date();
          if (invite.expires < today) {
            Invite.destroy({ id: invite.id }).exec(function(err){
              done('expired');
            });

            return;
          }

          done(null, invite);
        },

        function(invite, done){ // find the inviter user member
          Membership
            .findOne({ group: invite.group.id, user: invite.invitedBy.id })
            .exec(function(err, inviter){
              done(err, invite, inviter);
            });
        },

        function(invite, inviter, done){ // create new pending member
          Membership
            .create({
              group: invite.group.id,
              user: req.user.id,
              invitedBy: inviter.id
            })
            .exec(function(err, member){
              done(err, invite, member);
            });
        },

        function(invite, member, done){ // save Group member
          invite.group.members.add(member);
          invite.group.save(function(err, group){
            done(err, invite);
          });
        },

        function(invite, done){ // remove invite
          Invite.destroy({ id: invite.id }).exec(done);
        }

      ], function(err){
        if (err === 'not-found')
          return res.redirect('/v/notfound');

        if (err === 'expired')
          return res.redirect('/v/expired');

        //TODO: handle error

        res.redirect('/groups');
      });

      //console.log('Verified Invite for ' + req.user.username);
      return;
    }

    req.session.redirect = req.path;
    res.redirect('/login');
  },

  recoverPassword: function(req, res){

    async.waterfall([

      function(done){ // find the user token
        UserToken
          .findOne({ token: req.params.token })
          .populateAll()
          .exec(done);
      },

      function(userToken, done){ // validate token
        if (!userToken) return done('not-found');

        var today = new Date();
        if (userToken.expires < today) {
          UserToken.destroy({ id: userToken.id }).exec(function(err){
            done('expired');
          });

          return;
        }

        done(null, userToken);
      },

    ], function(err, userToken){
      if (err === 'not-found')
        return res.redirect('/v/notfound');

      if (err === 'expired')
        return res.redirect('/v/expired');

      //TODO: handle error

      res.redirect('/newpassword/' + userToken.token);
    });
  },

  newPassword: function(req, res){
    var password = req.body.password;
    var cpassword = req.body.cpassword;
    var token = req.params.token;

    if (password !== cpassword){
      req.flash('error', 'Error.Passport.Password.NotMatch');
      res.redirect('/newpassword/' + token);
      return;
    }

    async.waterfall([

      function(done){ // find the user token
        UserToken
          .findOne({ token: token })
          .populateAll()
          .exec(done);
      },

      function(userToken, done){ // validate token
        if (!userToken) return done('not-found');

        var today = new Date();
        if (userToken.expires < today) {
          UserToken.destroy({ id: userToken.id }).exec(function(err){
            done('expired');
          });

          return;
        }

        done(null, userToken);
      },

      function(userToken, done){ // update user with new password
        Passport.findOne({
          protocol : 'local',
          user     : userToken.user.id
        }, function (err, passport) {
          passport.password = password;
          passport.save(function(err){ done(err); });
        });
      },

      function(done){ // destroy token
        UserToken.destroy({ token: token }).exec(done);
      }

    ], function(err){
      if (err === 'not-found')
        return res.redirect('/v/notfound');

      if (err === 'expired')
        return res.redirect('/v/expired');

      //TODO: handle error

      req.flash('success', 'Success.Passport.Pasword.Updated');
      res.redirect('/login');
    });
  },

  verifyEmail: function(req, res){
    req.session.redirect = '';

    async.waterfall([

      function(done){ // find the user token
        UserToken
          .findOne({ token: req.params.token })
          .populateAll()
          .exec(done);
      },

      function(userToken, done){ // validate token
        if (!userToken) return done('not-found');

        var today = new Date();
        if (userToken.expires < today) {
          UserToken.destroy({ id: userToken.id }).exec(function(err){
            done('expired');
          });

          return;
        }

        done(null, userToken);
      },

      function(userToken, done){
        User.findOne({ id: userToken.user.id }).exec(function(err, user){
          if (err) return done(err);
          if (!user) return done(new Error('user not found'));

          user.email = userToken.email || user.email;
          user.verified = true;

          user.save(function(err, user){
            if (err) return done(err);
            UserToken.destroy({ id: userToken.id }).exec(done);
          })
        });
      }

    ], function(err){
      if (err === 'not-found')
        return res.redirect('/v/notfound');

      if (err === 'expired')
        return res.redirect('/v/expired');

      if (err) console.dir(err);
      //TODO: handle error

      req.flash('success', 'Success.Passport.Email.Verified');
      res.redirect('/profile');
    });

  }

};
