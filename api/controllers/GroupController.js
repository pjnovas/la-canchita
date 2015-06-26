/**
 * GroupController
 *
 * @description :: Server-side logic for managing groups
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var async = require('async');

module.exports = {

  find: function(req, res, next){

    async.waterfall([

      // find user memberships
      function(done){
        Membership.find({ user: req.user.id }, done);
      },

      // find groups for those memberships
      function(memberships, done){
        if (!memberships || !memberships.length){
          // if user has no memberships wont be groups
          return done(null, []);
        }

        var gids = memberships.map(function(m){
          return m.group && m.group.id || m.group ;
        });

        Group
          .find({ id: gids })
          .populateAll()
          .exec(done);
      },

    ], function(err, groups){
      if (err) return next(err);
      res.json(groups || []);
    });

  },

  update: function(req, res, next){

    Group
      .findOne({ id: req.params.id })
      .exec(function(err, group){
        if (err) return next(err);
        if (!group) return res.notFound();

        group.title = req.body.title || group.title;
        group.description = req.body.description || group.description;
        group.picture = req.body.picture || group.picture;

        group.save(function(err, group){
          if (err) return next(err);
          res.json(group);
        });
      });
  },

  destroy: function(req, res, next){

    Group
      .findOne({ id: req.params.id })
      .exec(function(err, group){
        if (err) return next(err);
        if (!group) return res.notFound();

        Membership
          .find({ group: req.params.id, role: 'owner' })
          .exec(function(err, owners){
            if (err) return next(err);

            if (owners.length > 1){
              return res.forbidden('cannot_destroy_group_with_more_than_1_owners');
            }

            group.destroy(function(err){
              if (err) return next(err);
              res.status(204);
              res.end();
            });
          });
      });
  },

  create: function(req, res, next){

    async.waterfall([

      // create the Group
      function(done){
        Group.create(req.body, done);
      },

      // create the Owner Member and add it to the group
      function(group, done){

        Membership.create({
          user: req.user.id,
          group: group.id,
          role: 'owner',
          state: 'active'
        }, function(err, member){
          group.members.add(member);
          group.save(done);
        });
      },

      // populate members into the group
      function(group, done){

        Membership
          .find( { group: group.id })
          .populateAll()
          .exec(function(err, members){
            if (err) return done(err);
            group.members = members;
            done(null, group);
          });
      }

    ], function(err, group){
      if (err) return next(err);
      res.json(group);
    });

  },

  add: function(req, res, next){
    var groupId = req.params.parentid;

    if (req.options.alias !== 'members'){
      return next();
    }

    async.waterfall([

      // Membership already exists?
      function(done){
        Membership.findOne({ group: groupId, user: req.body.user },
        function(err, member){
          if (err) return done(err);

          if (member) {
            res.conflict('User is already a member.');
            return done('exited');
          }

          done();
        });
      },

      // Find Group
      function(done){
        Group.findOne({ id: groupId }).populateAll().exec(done);
      },

      // Create Membership Group
      function(group, done){
        if (!group) return res.notFound();

        Membership.create({
          group: groupId,
          user: req.body.user,
          invitedBy: req.groupMember.id
        }, function(err, member){
          done(err, group, member);
        });
      },

      // Create Membership Group
      function(group, member, done){
        group.members.add(member);
        group.save(function(err, group){
          done(err, member);
        });
      }

    ], function(err, member){
      if (err) {
        if (err === 'exited') return;
        return next(err);
      }

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

  setRole: function(req, res, next){
    var member = req.requestedMember;

    member.role = req.body.role;
    member.save(function(err, member){
      if (err) return next(err);
      res.json(member);
    });

  }

};
