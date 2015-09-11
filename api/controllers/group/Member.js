
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
    var _group;

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

      // Validate emails and if invitations already exists
      function(done){
        var emails = req.invites.emails || [];

        if (emails.length === 0){
          return done();
        }

        Invite
          .find({ group: groupId, email: emails })
          .exec(function(err, invites){
            if (err) return done(err);
            if (invites.length === 0) return done();

            var expiredOnes = [];
            var today = new Date();

            invites.forEach(function(invite){
              if (invite.expires < today){
                expiredOnes.push(invite.id);
              }
              else {
                var idx = emails.indexOf(invite.email);
                req.invites.emails.splice(idx, 1);
              }
            });

            if (expiredOnes.length > 0){ // destroy expired ones
              Invite.destroy({ id: expiredOnes }).exec(function(err){
                //TODO: manage error
                done();
              });

              return;
            }

            done();
          });
      },

      // create Invite tokens and send emails
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

            Invite
              .find({ id: invites.map(function(inv){ return inv.id; }) })
              .populateAll()
              .exec(function(err, invites){
                sails.services.email.sendInvites(invites, function(err){
                  if (err) console.dir(err);
                  done(); // avoid break if invitation emails fails
                });
              });

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
        req.invites.reinvite = [];

        // remove existant users
        group.members.forEach(function(member){
          var idx = users.indexOf(member.user);
          if (idx >= 0){

            if (['rejected', 'removed', 'left'].indexOf(member.state) > -1) {
              // re invite removed or rejected members
              req.invites.reinvite.push(member);
            }

            users.splice(idx, 1);
          }
        });

        if (req.invites.reinvite.length === 0 && users.length === 0){
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
          _group = group.toJSON();
          done(err, members);
        });
      },

      // save reinvites
      function(members, done){
        var invites = req.invites.reinvite;

        if (!invites.length){
          return done(null, members);
        }

        async.series(
          invites.map(function(member){

            return function(_done){

              Membership.update({ id: member.id }, {
                invitedBy: req.groupMember.id,
                state: 'pending',
                role: 'member'
              }).exec(function(err, updates){ _done(err, updates[0]); });

            };
          })
        ,function(err, updated){
          done(err, (members || []).concat(updated || []));
        });
      }

    ], function(err, members){
      if (err) {
        if (err === 'exited') return;
        if (err === 'no-users') return res.json([]);
        return next(err);
      }

      // fetch and assign member users
      var memberIds = members.map(function(member){ return member.id; });

      Membership
        .find({ id: memberIds })
        .populate('user')
        .populate('invitedBy')
        .exec(function(err, members){
          if (err) return next(err);

          members.forEach(function(member){
            member.user = _.pick(member.user, ['id', 'name', 'picture']);
            member.invitedBy.user = _.pick(req.user, ['id', 'name', 'picture']);
          });

          res.json(members);

          sails.services.notifications.group(groupId, "new_members", members, req.user);
          sails.services.notifications.invites(_group, members, req.user);
        });

    });
  },

  remove: function(req, res, next){
    var member = req.requestedMember;

    member.state = 'removed';
    member.removedBy = req.groupMember.id;

    member.save(function(err, member){
      if (err) return next(err);
      res.json(member);
      sails.services.notifications.group(req.requestedMember.group.id, "update_member", member, req.user);
    });
  },

  change: function(req, res, next){
    var member = req.requestedMember;

    member.role = req.body.role;
    member.save(function(err, member){
      if (err) return next(err);
      res.json(member);
      sails.services.notifications.group(req.requestedMember.group.id, "update_member", member, req.user);
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
      sails.services.notifications.group(req.groupMember.group.id, "update_member", member, req.user);
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
      sails.services.notifications.group(req.groupMember.group.id, "update_member", member, req.user);
    });

  },

};
