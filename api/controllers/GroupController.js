/**
 * GroupController
 *
 * @description :: Server-side logic for managing groups
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var MemberController = require('./group/Member');
var MeetingController = require('./group/Meeting');

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

  createMember: MemberController.create,
  removeMember: MemberController.remove,
  changeMember: MemberController.change,
  createMe: MemberController.createMe,
  removeMe: MemberController.removeMe,

  createMeeting: MeetingController.create,
  removeMeeting: MeetingController.remove,
  changeMeeting: MeetingController.change,

};
