
module.exports = {

  create: function(req, res, next){
    var groupId = req.params.gid;

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