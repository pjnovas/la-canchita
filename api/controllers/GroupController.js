/**
 * GroupController
 *
 * @description :: Server-side logic for managing groups
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var moment = require('moment');

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

      // prepare groups data
      function(groups, done){
        var result = groups.map(function(group){
          var g = group.toJSON();

          var members = g.members.filter(function(member){
            return (member.user === req.user.id);
          });

          g.member = {
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

        done(null, result);
      },

    ], function(err, groups){
      if (err) return next(err);
      res.json(groups || []);
    });

  },

  findOne: function(req, res, next){

    async.waterfall([

      // fetch Group
      function (done){
        Group
          .findOne({ id: req.params.id })
          .populate('members')
          .exec(done);
      },

      // fetch & fill users members
      function (group, done){
        var userIds = _.pluck(group.members, 'user');
        User
          .find()
          .where({ id: userIds })
          .exec(function(err, users){

            if (err) return done(err);

            var usersObj = _.indexBy(users, 'id');

            _.forEach(group.members, function(member) {
              member.user = _.pick(usersObj[member.user], ['id', 'name', 'picture']);
            });

            done(err, group);
          });
      },

    ], function(err, group){
      if (err) return next(err);
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

            //TODO: remove group picture
            //TODO: clear relations ( members, meetings, invites, etc)

            group.destroy(function(err){
              if (err) return next(err);
              res.status(204);
              res.end();
            });
          });
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
  createMeeting: MeetingController.create,
  removeMeeting: MeetingController.remove,
  changeMeeting: MeetingController.change,

  joinMeeting: MeetingController.join,
  confirmMeeting: MeetingController.confirm,
  leaveMeeting: MeetingController.leave,

};
