var expect = require('expect.js');

describe('\nGroup ( ͡°( ͡° ͜ʖ( ͡° ͜ʖ ͡°)ʖ ͡°) ͡°)\n', function() {

  describe('POST /groups', function() {

    it('must create a group and set user as Owner', function (done) {

      var group = {
        title: 'Group Awesome',
        description: 'My cool group',
        picture: 'http://pic.com/pic.png'
      };

      global.userAgents[0]
        .post('/api/groups')
        .send(group)
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          var g = res.body;
          expect(g).to.be.an('object');

          for (var p in group){
            expect(g[p]).to.be.equal(group[p]);
          }

          expect(g.members).to.be.an('array');
          expect(g.members.length).to.be.equal(1);

          var me = g.members[0];
          expect(me).to.be.an('object');
          expect(me.user).to.be.an('object');
          expect(me.user.id).to.be.equal(global.userAgents[0].user.id);
          expect(me.role).to.be.equal('owner');
          expect(me.status).to.be.equal('active');
          expect(me.group).to.be.an('object');
          expect(me.group.id).to.be.equal(g.id);

          done();
        });

    });

  });

  describe('GET /groups', function() {

    it('must return the groups where the user is member', function (done) {

      // first create another group with other user
      global.userAgents[1]
        .post('/api/groups')
        .send({ title: 'other Group not owned '})
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('object');
          var otherGroupId = res.body.id;

          // now get groups for user0 should be still 1 (not see the below one)
          global.userAgents[0]
            .get('/api/groups')
            .expect(200)
            .end(function(err, res){
              if (err) return done(err);
              expect(res.body).to.be.an('array');
              expect(res.body.length).to.be.equal(1);

              expect(res.body[0].id).to.not.be.equal(otherGroupId);

              done();
            });
        });
    });

    it('must return owned groups no matter the search', function (done) {

      // try a search query
      global.userAgents[0]
        .get("/api/groups?where={title:'Group'}")
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.equal(1);
          done();
        });
    });

  });

  describe('GET /groups/:id', function() {

    it('must not allow to get a group where is not a member', function (done) {

      // first create another group with other user
      global.userAgents[1]
        .post('/api/groups')
        .send({ title: 'some Group mine '})
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('object');
          var otherGroupId = res.body.id;

          // now get groups for user0
          global.userAgents[0]
            .get('/api/groups/' + otherGroupId)
            .expect(404)
            .end(done);
        });
    });

  });

  describe('PUT /groups/:id', function() {
    var gid;

    it('must update a group', function (done) {

      // get a group to update
      global.userAgents[0]
        .get("/api/groups")
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.equal(1);

          var group = res.body[0];

          group.title = 'Group Awesome 2';
          group.description = 'My cool group 2';
          group.picture = 'http://pic.com/pic2.png';

          global.userAgents[0]
            .put('/api/groups/' + group.id)
            .send(group)
            .expect(200)
            .end(function(err, res){
              if (err) return done(err);
              var g = res.body;
              expect(g).to.be.an('object');
              expect(g.id).to.be.equal(group.id);

              ['title', 'description', 'picture'].forEach(function(p){
                expect(g[p]).to.be.equal(group[p]);
              });

              done();
            });
        });

    });

    it('must NOT update a group where is not a member', function (done) {

      // get a group of userA to update
      global.userAgents[0]
        .get("/api/groups")
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.equal(1);

          // send an update from userB, should see a NOT FOUND
          global.userAgents[1]
            .put('/api/groups/' + res.body[0].id)
            .send({ title: 'A new title!'})
            .expect(404)
            .end(done);
        });

    });

    it('must NOT update a group if user has role member', function (done) {

      // get a group of userA to update
      global.userAgents[0]
        .get("/api/groups")
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.equal(1);
          gid = res.body[0].id;

          // userA invites userB
          global.userAgents[0]
            .post('/api/groups/' + gid + '/members')
            .send({ user: global.userAgents[1].user.id })
            .expect(200)
            .end(function(err, res){
              if (err) return done(err);
              expect(res.body).to.be.an('object');
              expect(res.body.status).to.be.equal('pending');

              // userB accepts invitation
              global.userAgents[1]
                .post('/api/groups/' + gid + '/members/me')
                .expect(200)
                .end(function(err, res){
                  if (err) return done(err);
                  expect(res.body).to.be.an('object');
                  expect(res.body.status).to.be.equal('active');
                  expect(res.body.role).to.be.equal('member');

                  // userB tries to update
                  global.userAgents[1]
                    .put('/api/groups/' + gid)
                    .send({ title: 'Not new title!'})
                    .expect(403)
                    .end(done);

                });

            });
        });

    });

    it('must NOT update a group if user has role moderator', function (done) {
      var userB = global.userAgents[1].user;

      // userA gets userB memberId
      global.userAgents[0]
        .get('/api/groups/' + gid)
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('object');

          var mid;
          res.body.members.forEach(function(member){
            if (member.user === userB.id){
              mid = member.id;
            }
          });

          expect(mid).to.be.ok();

          // userA changes role of userB to admin
          global.userAgents[0]
            .put('/api/groups/' + gid + '/members/' + mid)
            .send({ role: 'moderator' })
            .expect(200)
            .end(function(err, res){
              if (err) return done(err);
              expect(res.body).to.be.an('object');
              expect(res.body.role).to.be.equal('moderator');

              // userB tries to update
              global.userAgents[1]
                .put('/api/groups/' + gid)
                .send({ title: 'Not new title!'})
                .expect(403)
                .end(done);

            });

      });
    });

    it('must update a group if user has role admin', function (done) {
      var userB = global.userAgents[1].user;

      // userA gets userB memberId
      global.userAgents[0]
        .get('/api/groups/' + gid)
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('object');

          var mid;
          res.body.members.forEach(function(member){
            if (member.user === userB.id){
              mid = member.id;
            }
          });

          expect(mid).to.be.ok();

          // userA changes role of userB to admin
          global.userAgents[0]
            .put('/api/groups/' + gid + '/members/' + mid)
            .send({ role: 'admin' })
            .expect(200)
            .end(function(err, res){
              if (err) return done(err);
              expect(res.body).to.be.an('object');
              expect(res.body.role).to.be.equal('admin');

              // userB CAN to update
              global.userAgents[1]
                .put('/api/groups/' + gid)
                .send({ title: 'Not new title!'})
                .expect(200)
                .end(done);

            });

      });
    });

  });

  describe('POST /groups/:id/members', function() {
    var gid;

    before(function(done){
      // set a group id of user A for members test
      global.userAgents[0]
        .get("/api/groups/")
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.equal(1);

          var group = res.body[0];
          expect(group).to.be.an('object');
          expect(group.members.length).to.be.equal(2);
          gid = group.id;
          done();
        });
    });

    it('must create a member as pending', function(done){
      var userC = global.userAgents[2].user;

      // user A > invites > user C
      global.userAgents[0]
        .post('/api/groups/' + gid + '/members')
        .send({ user: userC.id })
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);

          var member = res.body;
          expect(member).to.be.an('object');
          expect(member.id).to.be.ok();
          expect(member.user).to.be.equal(userC.id);
          expect(member.group).to.be.equal(gid);

          expect(member.role).to.be.equal('member');
          expect(member.status).to.be.equal('pending');

          done();
        });

    });

    it ('users pending cannot see the group', function(done){
        var userC = global.userAgents[2].user;

        // user C
        global.userAgents[2]
          .get('/api/groups/' + gid)
          .expect(404)
          .end(done);
      });

    it('must throw error if the user is already a member', function(done){
      var userC = global.userAgents[2].user;

      // user A > invites > user C AGAIN
      global.userAgents[0]
        .post('/api/groups/' + gid + '/members')
        .send({ user: userC.id })
        .expect(409)
        .end(done);

    });

    describe('POST /groups/:id/members/me', function() {

      it ('must change the status of the member to active', function(done){
        var userC = global.userAgents[2].user;

        // user C (which is pending) is going to accept
        global.userAgents[2]
          .post('/api/groups/' + gid + '/members/me')
          .expect(200)
          .end(function(err, res){
            if (err) return done(err);

            var member = res.body;
            expect(member).to.be.an('object');
            expect(member.id).to.be.ok();
            expect(member.user.id).to.be.equal(userC.id);
            expect(member.group.id).to.be.equal(gid);

            expect(member.role).to.be.equal('member');
            expect(member.status).to.be.equal('active');

            done();
          });

      });
    });

    describe('DELETE /groups/:id/members/me', function() {

      it ('must change the status of the member to removed if was active', function(done){
        var userC = global.userAgents[2].user;

        // user C (which is active) is going to be removed
        global.userAgents[2]
          .delete('/api/groups/' + gid + '/members/me')
          .expect(200)
          .end(function(err, res){
            if (err) return done(err);

            var member = res.body;
            expect(member).to.be.an('object');
            expect(member.id).to.be.ok();
            expect(member.user.id).to.be.equal(userC.id);
            expect(member.group.id).to.be.equal(gid);

            expect(member.role).to.be.equal('member');
            expect(member.status).to.be.equal('removed');

            done();
          });
      });

      it ('must change the status of the member to rejected if was pending', function(done){
        var userD = global.userAgents[3].user;

        // user A > invites > user D
        global.userAgents[0]
          .post('/api/groups/' + gid + '/members')
          .send({ user: userD.id })
          .expect(200)
          .end(function(err, res){
            if (err) return done(err);

            var member = res.body;
            expect(member).to.be.an('object');
            expect(member.id).to.be.ok();
            expect(member.user).to.be.equal(userD.id);
            expect(member.group).to.be.equal(gid);

            expect(member.role).to.be.equal('member');
            expect(member.status).to.be.equal('pending');

            // userD rejects the invite
            global.userAgents[3]
              .delete('/api/groups/' + gid + '/members/me')
              .expect(200)
              .end(function(err, res){
                if (err) return done(err);

                var member = res.body;
                expect(member).to.be.an('object');
                expect(member.id).to.be.ok();
                expect(member.user.id).to.be.equal(userD.id);
                expect(member.group.id).to.be.equal(gid);

                expect(member.role).to.be.equal('member');
                expect(member.status).to.be.equal('rejected');

                done();
              });

          });

      });

      it ('users cannot see the group if they are removed or rejected', function(done){
        var userC = global.userAgents[2].user;
        var userD = global.userAgents[3].user;

        // user C
        global.userAgents[2]
          .get('/api/groups/' + gid)
          .expect(404)
          .end(function(err, res){

            global.userAgents[3]
              .get('/api/groups/' + gid)
              .expect(404)
              .end(done);
          });
      });

    });

    describe('PUT /groups/:id/members/me', function(){
      it ('must update itself, like downgrade its own role');
    });

    describe('PUT /groups/:id/members/:id', function(){
      it ('must set role of a user');
      it ('must not allow to set role bigger or equal of what it has');
    });

    it('must not allow to invite if user has a member role');

    it('must allow to invite if user has a moderator role');

    it('must allow to invite if user has a admin role');

    it('must throw error if the user invited does not exist');

    it('must do something if the user is a member removed, active or revoked');

  });

  describe('DELETE /groups/:id/members/:id', function(){
    it ('must allow to kick a user');
    it ('must not allow to kick a user if is member');
    it ('must not allow to kick a user if is moderator');
    it ('must allow to kick a user if is admin');
  });

  describe('DELETE /groups/:id', function(){
    it ('must allow to remove a group only if is owner and there is no matches');
  });

});