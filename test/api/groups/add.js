
var builder = require('./builder');

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

  function checkUpdate(m, gid, uid, index, done){
    expect(m).to.be.an('object');

    expect(m.id).to.be.ok();
    expect(m.user).to.be.equal(uid);
    expect(m.group).to.be.equal(gid);

    expect(m.role).to.be.equal('member');
    expect(m.state).to.be.equal('pending');

    getMemberId(groups[0].id, userAgents[index].user.id, function(err, inviter){
      expect(m.invitedBy).to.be.equal(inviter.id);
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

  it('Allow ROLE [owner]', function (done) {
    var gid = groups[0].id;
    var uid = 8;

    sendInviteBy(0, gid, uid, 200, function(err, res){
      if (err) done(err);
      checkUpdate(res.body, gid, uid, 0, done);
    });

  });

  it('Allow ROLE [admin]', function (done) {
    var gid = groups[0].id;
    var uid = 9;

    sendInviteBy(1, gid, uid, 200, function(err, res){
      if (err) done(err);
      checkUpdate(res.body, gid, uid, 1, done);
    });

  });

  it('Allow ROLE [moderator]', function (done) {
    var gid = groups[0].id;
    var uid = 10;

    sendInviteBy(2, gid, uid, 200, function(err, res){
      if (err) done(err);
      checkUpdate(res.body, gid, uid, 2, done);
    });

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

  it('User is already a member - Conflict', function (done) {
    sendInviteBy(0, groups[0].id, 2, 409, done);
  });

  it('User is already invited - Conflict', function (done) {
    sendInviteBy(0, groups[0].id, 4, 409, done);
  });

});