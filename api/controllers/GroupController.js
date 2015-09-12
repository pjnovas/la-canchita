/**
 * GroupController
 *
 * @description :: Server-side logic for managing groups
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var _ = require('lodash');
var moment = require('moment');

var MemberController = require('./group/Member');
var MeetingController = require('./group/Meeting');

module.exports = {

  find: function(req, res, next){

    async.waterfall([

      // find user memberships
      function(done){
        Membership
          .find({ user: req.user.id })
          .populate('invitedBy')
          .exec(done);
      },

      // find groups for those memberships
      function(memberships, done){
        if (!memberships || !memberships.length){
          // if user has no memberships wont be groups
          return done('exited');
        }

        var gids = memberships.map(function(m){
          return m.group && m.group.id || m.group ;
        });

        Group
          .find({ id: gids })
          .where({ removed: false })
          .populateAll()
          .exec(function(err, groups){
            done(err, memberships, groups);
          });
      },

      // prepare groups data
      function(ownMembers, groups, done){
        var result = groups.map(function(group){
          var g = group.toJSON();

          var members = ownMembers.filter(function(member){
            return (member.group === group.id);
          });

          g.member = {
            createdAt: members[0].createdAt,
            updatedAt: members[0].updatedAt,
            invitedBy: members[0].invitedBy,
            role: members[0].role,
            state: members[0].state
          };

          g.count = {
            members: g.members.length,
            meetings: g.meetings && g.meetings.length || 0
          };

          delete g.meetings;
          delete g.members;

          return g;
        });

        done(null, result || []);
      },

      // set invitor users
      function(groups, done){

        var uids = groups.map(function(group){
          return group.member.invitedBy && group.member.invitedBy.user;
        });

        User.find({ id: uids }).exec(function(err, users){
          if (err) return done(err, groups);

          groups.forEach(function(group){

            if (group.member.invitedBy){

              var found = users.filter(function(user){
                return group.member.invitedBy.user === user.id;
              });

              if (found.length){
                var u = found[0].toJSON();
                group.member.invitedBy.user = _.pick(u, ['id', 'name', 'picture']);
              }
            }

          });

          done(null, groups);
        });

      }

    ], function(err, groups){
      if (err && err !== 'exited') {
        return next(err);
      }
      res.json(groups || []);
    });

  },

  findOne: function(req, res, next){

    async.waterfall([

      // fetch Group
      function (done){
        Group
          .findOne({ id: req.params.id })
          .exec(done);
      },

      // set member in the group
      function (group, done){

        if (group.removed){
          done('removed');
          return;
        }

        group = group.toJSON();
        group.member = req.groupMember;
        group.member.user = _.pick(group.member.user, ['id', 'name', 'picture']);
        done(null, group);
      }

    ], function(err, group){
      if (err === 'removed') {
        res.notFound('group not found');
        return;
      }
      else if (err) return next(err);

      res.json(group);
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

        group.save(function(err, group){
          if (err) return next(err);
          res.json(group);

          sails.services.notifications.group(req.params.id, "update", group, req.user);
        });
      });
  },

  destroy: function(req, res, next){
    var gid = req.params.id;

    Group
      .findOne({ id: gid })
      .populateAll()
      .exec(function(err, group){
        if (err) return next(err);
        if (!group) return res.notFound();

        function ready(err){
          if (err) return next(err);
          res.status(204);
          res.end();
          sails.services.notifications.group(gid, "remove", { id: gid }, req.user);
        }

        function removeGroup(){
          async.series([
            // destroy members
            function(done){
              Membership.destroy({ group: gid }).exec(done);
            },

            // destroy meetings
            function(done){
              Meeting.destroy({ group: gid }).exec(done);
            },

            // remove picture file
            function(done){
              if (group.picture){
                sails.services.image.remove('group', group.picture, done);
                return;
              }
              done();
            },

            // destroy group
            function(done){
              group.destroy(done);
            }
          ], ready);
        }

        if (group.members.length === 1 || !group.meetings || group.meetings.length === 0){
          // destroy groups with only owner as member or no meetings
          return removeGroup();
        }

        var owners = _.filter(group.members, function(m){ return m.role === 'owner'; });
        if (owners.length > 1){
          return res.forbidden('cannot_destroy_group_with_more_than_1_owners');
        }

        group.removed = true;
        group.save(ready);
      });
  },

  create: function(req, res, next){

    delete req.body.picture;

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

  uploadPicture: function (req, res) {

    var gid = req.params.gid;

    Group
      .findOne({ id: gid })
      .exec(function (err, group){

        if (err) return next(err);
        if (!group) return res.notFound();

        sails.services.image
          .upload(req, 'group', gid, function(err, filename){
            if (err == 'no-file'){
              return res.badRequest('No file was uploaded');
            }
            if (err == 'no-file'){
              return res.badRequest('only one file is allowed');
            }

            function updateGroup(){
              group.picture = filename;

              group.save(function (err, lgroup){
                if (err) return next(err);
                res.json({ picture: lgroup.picture });
              });
            }

            if (group.picture){

              sails.services.image
                .remove('group', group.picture, function(err){
                  updateGroup();
                });

              return;
            }

            updateGroup();

          });
      });

  },


  // Members

  getMembers: MemberController.find,
  createMember: MemberController.create,
  removeMember: MemberController.remove,
  changeMember: MemberController.change,

  createMe: MemberController.createMe,
  removeMe: MemberController.removeMe,


  // Meetings

  getMeetings: MeetingController.find,
  getFullMeeting: MeetingController.findOne,
  createMeeting: MeetingController.create,
  removeMeeting: MeetingController.remove,
  changeMeeting: MeetingController.change,

  joinMeeting: MeetingController.join,
  confirmMeeting: MeetingController.confirm,
  leaveMeeting: MeetingController.leave,

};
