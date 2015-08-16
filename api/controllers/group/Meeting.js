
module.exports = {

  find: function(req, res, next){

    Meeting
      .find({ group: req.params.gid })
      //.populateAll()
      .exec(function(err, meetings){
        if (err) return done(err);
        res.json(meetings);
      });
  },

  findOne: function(req, res, next){
    var meeting = req.requestedMeeting;
    var gmember = req.groupMember;
    var group = meeting.group.toJSON();

    group.member = gmember.toJSON();
    group.member.user = _.pick(group.member.user, ['id', 'name', 'picture']);

    delete group.member.group;
    meeting.group = group;

    var attendeeIds = meeting.attendees.map(function(attendee){ return attendee.id; });

    Attendee
      .find({ id: attendeeIds })
      .populate('user')
      .exec(function(err, attendees){
        if (err) return next(err);

        attendees.forEach(function(attendees){
          attendees.user = _.pick(attendees.user, ['id', 'name', 'picture']);
        });

        meeting.attendees = attendees;
        res.send(meeting);
      });
  },

  create: function (req, res, next){
    var groupId = req.params.gid;

    async.waterfall([

      // Find Group
      function(done){
        Group.findOne({ id: groupId }).populateAll().exec(done);
      },

      // Create a Meeting
      function(group, done){
        if (!group) return res.notFound();

        req.body.group = groupId;
        req.body.createdBy = req.groupMember.id;

        Meeting.create(req.body, function(err, meeting){
          done(err, group, meeting);
        });
      },

      // Add meeting to Group
      function(group, meeting, done){
        group.meetings.add(meeting);
        group.save(function(err, group){
          done(err, meeting);
        });
      }

    ], function(err, meeting){
      if (err) return next(err);
      res.json(meeting);
      sails.services.notifications.group(groupId, "new_meeting", meeting, req.user);
    });
  },

  change: function(req, res, next){
    var query = { id: req.params.meetingId };

    // Not allowed props
    delete req.body.id;
    delete req.body.createdBy;
    delete req.body.group;
    delete req.body.attendees;

    Meeting.update(query, req.body).exec(function(err, updated){
      if (err) return next(err);

      Meeting.findOne(query).populateAll().exec(function(err, meeting){
        if (err) return next(err);
        res.json(meeting);

        sails.services.notifications.meeting(req.params.meetingId, "update", meeting, req.user);
      });
    });

  },

  remove: function(req, res, next){
    var mid = req.requestedMeeting.id;

    req.requestedMeeting.destroy(function(err){
      res.status(204);
      res.end();

      sails.services.notifications.meeting(mid, "remove", { id: mid }, req.user);
    });

  },

  join: function(req, res, next){
    var meeting = req.requestedMeeting;

    Attendee.create({
      user: req.groupMember.user,
      meeting: meeting.id
    }, function(err, attendee){
      meeting.attendees.add(attendee);

      meeting.save(function(err, _meeting){
        if (err) return next(err);

        attendee.user = _.pick(req.groupMember.user, ['id', 'name', 'picture']);
        res.json(attendee);

        sails.services.notifications.meeting(meeting.id, "join", attendee, req.user);
      });
    });

  },

  leave: function(req, res, next){
    var meeting = req.requestedMeeting;

    var attendee = meeting.attendees.filter(function(attendee){
      return (attendee.user === req.groupMember.user.id);
    })[0];

    var attId = attendee.id;
    meeting.attendees.remove(attendee.id);

    meeting.save(function(err, _meeting){
      if (err) return next(err);

      attendee.destroy(function(err){
        if (err) return next(err);
        res.status(204);
        res.end();

        sails.services.notifications.meeting(meeting.id, "leave", { id: attId }, req.user);
      });

    });
  },

  confirm: function(req, res, next){
    var meeting = req.requestedMeeting;

    var attendee = meeting.attendees.filter(function(attendee){
      return (attendee.user === req.groupMember.user.id);
    })[0];

    attendee.isConfirmed = true;
    attendee.confirmedAt = new Date();

    attendee.save(function(err, _attendee){
      if (err) return next(err);
      var att = _attendee.toJSON();
      att.user = _.pick(req.groupMember.user, ['id', 'name', 'picture']);
      res.json(att);

      sails.services.notifications.meeting(meeting.id, "confirm", att, req.user);
    });
  },

};
