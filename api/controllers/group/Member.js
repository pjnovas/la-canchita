
var hat = require('hat');

module.exports = {

  find: function(req, res, next){

    Membership
      .find({ group: req.params.gid })
      .populate('user')
      .exec(function(err, members){
        if (err) return done(err);
        res.json(members);
      });
  },

  create: function(req, res, next){
    var groupId = req.params.gid;

    async.waterfall([

      // validations
      function(done){
        var users = [];

        if (req.body.users){
          users = req.body.users;
        }
        else if (req.body.user){
          users = [req.body.user];
        }

        req.invites = {
          users: _.uniq(users),
          emails: _.uniq(req.body.emails) || []
        };

        if (req.invites.emails.length + req.invites.users.length > 10){
          res.forbidden('Cannot invite more than 10 for once');
          return done('exited');
        }

        done();
      },

      // find users by invite emails to avoid email invitations to existant users
      function(done){
        if (req.invites.emails.length === 0){
          return done();
        }

        User
          .find({ email: req.invites.emails })
          .exec(function(err, _users){

            _users.forEach(function(user){
              var idx = req.invites.emails.indexOf(user.email);
              req.invites.emails.splice(idx, 1);
              req.invites.users.push(user.id);
            });

            req.invites.emails = _.uniq(req.invites.emails);
            req.invites.users = _.uniq(req.invites.users);

            done();
          });
      },

      // Validate emails and create Invite tokens
      function(done){
        var emails = req.invites.emails || [];

        if (emails.length === 0){
          return done();
        }

        Invite
          .create(
            emails.map(function(email){
              return {
                token: hat(),
                email: email,
                group: groupId,
                invitedBy: req.user.id
              };
            })
          ).exec(function(err, invites){
            //TODO: send emails
            done(err);
          });
      },

      // check if there is a need to continue
      function(done){
        done(req.invites.users.length === 0 ? 'no-users' : null);
      },

      // Find Group
      function(done){
        Group.findOne({ id: groupId }).populateAll().exec(done);
      },

      // Create Memberships
      function(group, done){
        if (!group) return res.notFound();
        var users = req.invites.users;

        // remove existant users
        group.members.forEach(function(member){
          var idx = users.indexOf(member.user);
          if (idx >= 0){
            users.splice(idx, 1);
          }
        });

        if (users.length === 0){
          return done('no-users');
        }

        var invites = users.map(function(uid){
          return {
            group: groupId,
            user: uid,
            invitedBy: req.groupMember.id
          };
        });

        Membership.create(invites, function(err, members){
          done(err, group, members);
        });
      },

      // Add Members to Group
      function(group, members, done){

        members.forEach(function(member){
          group.members.add(member);
        });

        group.save(function(err, group){
          done(err, members);
        });
      }

    ], function(err, members){
      if (err) {
        if (err === 'exited') return;
        if (err === 'no-users') return res.json([]);
        return next(err);
      }

      res.json(members);
    });
  },

  remove: function(req, res, next){
    var member = req.requestedMember;

    if (member.state === 'pending' || member.state === 'rejected'){
      // user wasn't a member yet
      member.destroy(function(err){
        res.status(204);
        res.end();
      });

      return;
    }

    member.state = 'removed';
    member.removedBy = req.groupMember.id;

    member.save(function(err, member){
      if (err) return next(err);
      res.json(member);
    });
  },

  change: function(req, res, next){
    var member = req.requestedMember;

    member.role = req.body.role;
    member.save(function(err, member){
      if (err) return next(err);
      res.json(member);
    });

  },

  createMe: function(req, res, next){
    var member = req.groupMember;

    if (member.state === 'active'){
      return res.conflict();
    }

    member.state = 'active';
    member.save(function(err, member){
      if (err) return next(err);
      res.json(member);
    });

  },

  removeMe: function(req, res, next){
    var member = req.groupMember;

    switch(member.state){
      case 'pending': member.state = 'rejected'; break;
      case 'active': member.state = 'left'; break;
    }

    member.save(function(err){
      if (err) return next(err);
      res.status(204);
      res.end();
    });

  },

};