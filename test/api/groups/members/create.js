
var builder = require('../builder');

describe('POST /groups/:id/members', function() {

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
      },{
        user: userAgents[1].user.id,
        role: 'admin',
        state: 'active'
      },{
        user: userAgents[2].user.id,
        role: 'moderator',
        state: 'active'
      },{
        user: userAgents[3].user.id,
        role: 'member',
        state: 'active'
      },{
        user: userAgents[4].user.id,
        role: 'moderator',
        state: 'pending'
      },{
        user: userAgents[5].user.id,
        role: 'moderator',
        state: 'rejected'
      },{
        user: userAgents[6].user.id,
        role: 'moderator',
        state: 'removed'
      }]
    }, {
      title: 'Group Awesome 2',
      description: 'My cool group 2',
      picture: 'http://pic.com/pic2.png',
      members: [{
        user: userAgents[7].user.id,
        role: 'owner',
        state: 'active'
      }]
    }, { //multiple invites
      title: 'Group Awesome 3',
      description: 'My cool group 3',
      picture: 'http://pic.com/pic.png',
      members: [{
        user: userAgents[0].user.id,
        role: 'owner',
        state: 'active'
      },{
        user: userAgents[1].user.id,
        role: 'admin',
        state: 'active'
      },{
        user: userAgents[2].user.id,
        role: 'moderator',
        state: 'active'
      }]
    }, { // invite removed or rejected
      title: 'Group Awesome 4',
      description: 'My cool group 4',
      picture: 'http://pic.com/pic2.png',
      members: [{
        user: userAgents[0].user.id,
        role: 'owner',
        state: 'active'
      },{
        user: userAgents[5].user.id,
        role: 'moderator',
        state: 'rejected'
      },{
        user: userAgents[6].user.id,
        role: 'moderator',
        state: 'removed'
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

  function checkUpdate(m, gid, uid, index){
    expect(m).to.be.an('object');

    expect(m.id).to.be.ok();
    expect(m.group).to.be.equal(gid);
    expect(m.role).to.be.equal('member');
    expect(m.state).to.be.equal('pending');

    expect(m.user).to.be.an('object');
    expect(m.user.id).to.be.equal(uid);
    expect(m.user.name).to.be.ok();
    expect(m.user.picture).to.be.ok();

    expect(m.user.username).to.not.be.ok();
    expect(m.user.email).to.not.be.ok();
    expect(m.user.passports).to.not.be.ok();
  }

  function checkUpdates(ms, gid, uids, index, done){
    expect(ms).to.be.an('array');
    expect(ms.length).to.be.greaterThan(0);

    if (!Array.isArray(uids)){
      uids = [uids];
    }

    getMemberId(gid, userAgents[index].user.id, function(err, inviter){

      ms.forEach(function(m, i){
        expect(m.invitedBy.id).to.be.equal(inviter.id);
        checkUpdate(m, gid, uids[i], index);
      });

      done();
    });
  }

  function sendInviteBy(index, gid, uid, expected, done){
    userAgents[index]
      .post('/api/groups/' + gid + '/members')
      .send({ user: uid })
      .expect(expected)
      .end(done);
  }

  function sendInvitesBy(index, gid, uids, emails, expected, done){
    userAgents[index]
      .post('/api/groups/' + gid + '/members')
      .send({ users: uids, emails: emails || [] })
      .expect(expected)
      .end(done);
  }

  it('Allow ROLE [owner]', function (done) {
    var gid = groups[0].id;
    var uid = 8;

    sendInviteBy(0, gid, uid, 200, function(err, res){
      if (err) done(err);
      checkUpdates(res.body, gid, uid, 0, done);
    });

  });

  it('Allow ROLE [admin]', function (done) {
    var gid = groups[0].id;
    var uid = 9;

    sendInviteBy(1, gid, uid, 200, function(err, res){
      if (err) done(err);
      checkUpdates(res.body, gid, uid, 1, done);
    });

  });

  it('Allow ROLE [moderator]', function (done) {
    var gid = groups[0].id;
    var uid = 10;

    sendInviteBy(2, gid, uid, 200, function(err, res){
      if (err) done(err);
      checkUpdates(res.body, gid, uid, 2, done);
    });

  });

  it('Allow multiples ROLE [owner]', function (done) {
    var userIdx = 0;
    var gid = groups[2].id;
    var uids = [userAgents[3].user.id, userAgents[4].user.id];
    var emails = ['t1@t.com', 't2@t.com', 'user5@example.com'];

    uids.push(userAgents[5].user.id); // invited by email

    sendInvitesBy(userIdx, gid, uids, emails, 200, function(err, res){
      if (err) done(err);
      expect(res.body.length).to.be.equal(3);

      checkUpdates(res.body, gid, uids, userIdx, function(){

        // validate token invites generation for emails

        var today = new Date();
        var aWeek = 7 * 24 * 60 * 60 * 1000;
        var nextWeek = new Date(today.getTime() + aWeek);

        Invite
          .find({ email: emails })
          .exec(function(err, invites){
            expect(err).to.not.be.ok();
            expect(invites.length).to.be.equal(2);

            invites.forEach(function(invite){
              expect(invite.expires).to.be.greaterThan(today);
              expect(invite.expires).to.be.lessThan(nextWeek);
              expect(invite.group).to.be.equal(gid);
              expect(invite.invitedBy).to.be.equal(userAgents[userIdx].user.id);
              expect(invite.token.length).to.be.greaterThan(0);
            });

            expect(invites[0].token).to.not.be.equal(invites[1].token);

            done();
          });

      });
    });

  });

  it('Allow multiples - only emails', function (done) {
    var userIdx = 0;
    var gid = groups[2].id;
    var emails = ['t100@t.com', 't200@t.com'];

    sendInvitesBy(userIdx, gid, [], emails, 200, function(err, res){
      if (err) done(err);
      expect(res.body.length).to.be.equal(0);

      Invite
        .find({ email: emails })
        .exec(function(err, invites){
          expect(err).to.not.be.ok();
          expect(invites.length).to.be.equal(2);
          done();
        });

    });

  });

  it('Allow multiples - invite by same email twice', function (done) {
    var userIdx = 0;
    var gid = groups[2].id;
    var emails = ['t110@t.com', 't210@t.com'];

    sendInvitesBy(userIdx, gid, [], emails, 200, function(err, res){
      if (err) done(err);
      expect(res.body.length).to.be.equal(0);

      sendInvitesBy(userIdx, gid, [], emails, 200, function(err, res){

        Invite
          .find({ email: emails })
          .exec(function(err, invites){
            expect(err).to.not.be.ok();
            expect(invites.length).to.be.equal(2); // same amount
            done();
          });

        });

    });

  });

  it('Allow multiples - RE invite by same email for expired ones', function (done) {
    var userIdx = 0;
    var gid = groups[2].id;
    var emails = ['t120@t.com', 't220@t.com'];

    sendInvitesBy(userIdx, gid, [], emails, 200, function(err, res){
      if (err) done(err);

      var today = new Date();
      var aDay = 24 * 60 * 60 * 1000;
      var yesterday = new Date(today.getTime() - aDay);
      var aWeek = 7 * 24 * 60 * 60 * 1000;
      var nextWeek = new Date(today.getTime() + aWeek);

      Invite
        .findOne({ email: emails[0] })
        .exec(function(err, invite){
          expect(err).to.not.be.ok();

          invite.expires = yesterday;
          invite.save(function(err, invite){
            expect(err).to.not.be.ok();
            expect(invite.expires).to.be.eql(yesterday);
            var lastInvite = invite;

            // re send invites
            sendInvitesBy(userIdx, gid, [], emails, 200, function(err, res){

              Invite
                .find({ email: emails })
                .exec(function(err, invites){
                  expect(err).to.not.be.ok();
                  expect(invites.length).to.be.equal(2); // same amount (removed last invite)

                  // a new invite is sent and it's different
                  var newInvite = invites[0];

                  expect(newInvite.id).to.not.be.equal(lastInvite.id);
                  expect(newInvite.token).to.not.be.equal(lastInvite.token);
                  expect(newInvite.expires).to.be.greaterThan(today);
                  expect(newInvite.expires).to.be.lessThan(nextWeek);

                  done();
                });

              });
          });

        });

    });

  });

  it('Allow multiples ROLE [admin]', function (done) {
    var gid = groups[2].id;
    var uids = [userAgents[6].user.id, userAgents[7].user.id];
    var emails = ['t3@t.com', 't4@t.com'];

    sendInvitesBy(1, gid, uids, emails, 200, function(err, res){
      if (err) done(err);
      checkUpdates(res.body, gid, uids, 1, done);
    });

  });

  it('Allow multiples ROLE [moderator]', function (done) {
    var gid = groups[2].id;
    var uids = [userAgents[8].user.id, userAgents[9].user.id];
    var emails = ['t5@t.com', 't6@t.com', 't7@t.com'];

    sendInvitesBy(2, gid, uids, emails, 200, function(err, res){
      if (err) done(err);
      checkUpdates(res.body, gid, uids, 2, done);
    });

  });

  it('Disallow more than 10 - Forbidden', function (done) {
    var gid = groups[2].id;
    var uids = [9, 10];
    var emails = [];

    for(var i = 1; i<=9; i++){
      emails.push('tmax' + i + '@t.com');
    }

    sendInvitesBy(2, gid, uids, emails, 403, done);

  });

  it('Disallow ROLE [member] - Forbidden', function (done) {
    sendInviteBy(3, groups[0].id, 12, 403, done);
  });

  it('Disallow STATE [pending] - NotFound', function (done) {
    sendInviteBy(4, groups[0].id, 12, 404, done);
  });

  it('Disallow STATE [rejected] - NotFound', function (done) {
    sendInviteBy(5, groups[0].id, 12, 404, done);
  });

  it('Disallow STATE [removed] - NotFound', function (done) {
    sendInviteBy(6, groups[0].id, 12, 404, done);
  });

  it('Disallow Non Member - NotFound', function (done) {
    sendInviteBy(7, groups[0].id, 12, 404, done);
  });

  it('User is already a member - OK no content', function (done) {
    sendInviteBy(0, groups[0].id, 2, 200, function(err, res){
      if (err) done(err);
      expect(res.body.length).to.be.equal(0);
      done();
    });
  });

  it('User is already invited - OK no content', function (done) {
    sendInviteBy(0, groups[0].id, 4, 200, function(err, res){
      if (err) done(err);
      expect(res.body.length).to.be.equal(0);
      done();
    });
  });

  it('User is rejected - OK - Re-Invite', function (done) {
    var gid = groups[3].id;
    var uid = userAgents[5].user.id;

    expect(groups[3].members[1].state).to.be.equal('rejected');
    expect(groups[3].members[1].user).to.be.equal(uid);

    sendInviteBy(0, gid, uid, 200, function(err, res){
      if (err) done(err);
      expect(res.body.length).to.be.equal(1);
      checkUpdates(res.body, gid, uid, 0, done);
    });
  });

  it('User is removed - OK - Re-Invite', function (done) {
    var gid = groups[3].id;
    var uid = userAgents[6].user.id;

    expect(groups[3].members[2].state).to.be.equal('removed');
    expect(groups[3].members[2].user).to.be.equal(uid);

    sendInviteBy(0, gid, uid, 200, function(err, res){
      if (err) done(err);
      expect(res.body.length).to.be.equal(1);
      checkUpdates(res.body, gid, uid, 0, done);
    });
  });

});
