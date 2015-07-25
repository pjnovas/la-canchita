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
          if (invite.expires < today) return done('expired');

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
          return res.redirect('/v/not-found');

        if (err === 'expired')
          return res.redirect('/v/expired');

        //TODO: handle error

        res.redirect('/');
      });

      //console.log('Verified Invite for ' + req.user.username);
      return;
    }

    req.session.redirect = req.path;
    res.redirect('/');
  },

  verifyEmail: function(req, res){
    req.session.redirect = '';

    if (req.session.authenticated){

      // make verification and go to profile with verification.

      console.log('Verified Email for ' + req.user.username);

      res.redirect('/');
      return;
    }

    req.session.redirect = req.path;
    res.redirect('/');
  }

};

