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

          // now get groups for user0
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

  describe('PUT /groups/:id', function() {

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

          // send an update from userB
          global.userAgents[1]
            .put('/api/groups/' + res.body[0].id)
            .send({ title: 'A new title!'})
            .expect(403)
            .end(done);
        });

    });

/*
    it('must NOT update a group if you have role member', function (done) {

      // get a group of userA to update
      global.userAgents[0]
        .get("/api/groups")
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.equal(1);

          // send an update from userB
          global.userAgents[1]
            .put('/api/groups/' + res.body[0].id)
            .send({ title: 'A new title!'})
            .expect(403)
            .end(done);
        });

    });
*/

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
          expect(group.members.length).to.be.equal(1);
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

  });

});