
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
    });
  },

  change: function(req, res, next){
    var query = { id: req.params.meetingId };

    // Not allowed props
    delete req.body.id;
    delete req.body.createdBy;
    delete req.body.group;
    delete req.body.assistants;
    delete req.body.confirmed;

    Meeting.update(query, req.body).exec(function(err, updated){
      if (err) return next(err);

      Meeting.findOne(query).populateAll().exec(function(err, meeting){
        if (err) return next(err);
        res.json(meeting);
      });
    });

  },

  remove: function(req, res, next){

    req.requestedMeeting.destroy(function(err){
      res.status(204);
      res.end();
    });

  },

  join: function(req, res, next){
    var meeting = req.requestedMeeting;

    meeting.assistants.add(req.groupMember);

    meeting.save(function(err, _meeting){
      if (err) return next(err);
      res.status(204);
      res.end();
    });
  },

  leave: function(req, res, next){
    var meeting = req.requestedMeeting;

    meeting.assistants.remove(req.groupMember.id);

    meeting.save(function(err, _meeting){
      if (err) return next(err);
      res.status(204);
      res.end();
    });
  },

  confirm: function(req, res, next){
    var meeting = req.requestedMeeting;

    meeting.confirmed.add(req.groupMember);

    meeting.save(function(err, _meeting){
      if (err) return next(err);
      res.status(204);
      res.end();
    });
  },

};