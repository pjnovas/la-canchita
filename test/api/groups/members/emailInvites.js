
var request = require('supertest');
var builder = require('../builder');

describe('GET /v/invite/:token', function() {

  var groups;

  before(function(done){

    var groups_data = [{
      title: 'Group Awesome',
      description: 'My cool group',
      picture: 'http://pic.com/pic.png',
      members: [{
        user: userAgents[0].user.id,
        role: 'owner',
        state: 'active'
      }]
    }];

    builder.create(groups_data, function(err, _groups){
      groups = _groups;
      done();
    });

  });

  after(builder.clean);

  function getMemberId(gid, uid, done){
    Membership.findOne({ group: gid, user: uid }).exec(done);
  }

  function checkMember(m, gid, uid){
    expect(m).to.be.an('object');

    expect(m.id).to.be.ok();
    expect(m.user).to.be.equal(uid);
    expect(m.group).to.be.equal(gid);

    expect(m.role).to.be.equal('member');
    expect(m.state).to.be.equal('pending');
  }

  function sendInvitesBy(index, gid, emails, expected, done){
    userAgents[index]
      .post('/api/groups/' + gid + '/members')
      .send({ emails: emails })
      .expect(expected)
      .end(done);
  }

  it('New User: Verifies a token an add as pending member', function (done) {
    var userIdx = 0;
    var gid = groups[0].id;
    var email = 'newuser@example.com';
    var token, agent;

    async.series([

      function(_done){ //invite a user by email
        sendInvitesBy(userIdx, gid, [email], 200, function(err, res){
          if (err) _done(err);
          expect(res.body.length).to.be.equal(0);
          _done();
        });
      },

      function(_done){ //get invitation token
        Invite
          .findOne({ email: email })
          .exec(function(err, invite){
            if (err) _done(err);
            expect(invite).to.be.an('object');
            token = invite.token;
            _done();
          });
      },

      function(_done){ //must redirect if no logged in user (create agent)
        agent = request.agent(sails.hooks.http.app);
        agent
          .get('/v/invite/' + token)
          .expect(302)
          .end(function(err){
            _done();
          });
      },

      function(_done){ // user gets redirected to login and register to the app
        agent
          .post('/auth/local/register')
          .send({
            username: 'newuser',
            email: email, //email invited
            password: 'some-password'
          })
          .end(function(err, _user){
            agent.get('/api/users/me').end(function(err, res){
              agent.user = res.body;
              _done();
            });
          });
      },

      function(_done){ // user sends an invalid token
        agent
          .get('/v/invite/notfound')
          .expect(302)
          .end(function(err, res){
            expect(res.headers.location).to.be.equal('/v/notfound');
            _done();
          });
      },

      function(_done){ // user resends the the invite token
        agent
          .get('/v/invite/' + token)
          .expect(302)
          .end(function(err){
            _done();
          });
      },

      function(_done){ // user gets invited to the group
        var newuser = agent.user;

        getMemberId(gid, newuser.id, function(err, member){
          expect(err).to.not.be.ok();

          checkMember(member, gid, newuser.id);

          getMemberId(gid, userAgents[userIdx].user.id, function(err, inviter){
            expect(member.invitedBy).to.be.equal(inviter.id);
            _done();
          });
        });
      },

      function(_done){ // Invite gets removed
        Invite
          .findOne({ email: email })
          .exec(function(err, invite){
            if (err) _done(err);
            expect(invite).to.not.be.ok();
            _done();
          });
      },

      function(_done){ // user sends an invitation expired
        var email = 'other@e-mail.com';
        //create an expired token
        sendInvitesBy(userIdx, gid, [email], 200, function(err, res){
          if (err) _done(err);

          var today = new Date();
          var aDay = 24 * 60 * 60 * 1000;
          var yesterday = new Date(today.getTime() - aDay);

          Invite
            .update({ email: email }, { expires: yesterday })
            .exec(function(err, invite){
              if (err) _done(err);
              expect(invite).to.be.an('object');
              var expired_token = invite[0].token;

              agent
                .get('/v/invite/' + expired_token)
                .expect(302)
                .end(function(err, res){
                  expect(res.headers.location).to.be.equal('/v/expired');

                  Invite
                    .findOne({ email: email })
                    .exec(function(err, invite){
                      if (err) _done(err);
                      expect(invite).to.not.be.ok();
                      _done();
                    });

                });

          });

        });

      },

    ], done);

  });

});
