
var builder = require('../builder');

describe('GET /meetings/:id', function() {

  var groups;

  before(function(done){

    var groups_data = [{
      title: 'Group Awesome',
      description: 'My cool group',
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
        role: 'member',
        state: 'pending'
      },{
        user: userAgents[5].user.id,
        role: 'member',
        state: 'rejected'
      },{
        user: userAgents[6].user.id,
        role: 'member',
        state: 'removed'
      }]
    }, {
      title: 'Group Awesome 2',
      description: 'My cool group 2',
      members: [{
        user: userAgents[7].user.id,
        role: 'owner',
        state: 'active'
      }]
    }];

    builder.create(groups_data, function(err, _groups){
      groups = _groups;

      groups[0].meetings.add([{
        createdBy: groups[0].members[0].id,
        title: 'Meeting 0',
        attendees: [{
          user: userAgents[0].user.id
        }, {
          user: userAgents[1].user.id
        }]
      }]);

      groups[0].save(function(err, group){
        expect(group.meetings.length).to.be.equal(1);
        groups[0] = group;
        done();
      });
    });

  });

  after(builder.clean);

  function checkUser(aUser, user){
    expect(aUser).to.be.an('object');

    if (user){
      expect(aUser.id).to.be.equal(user.id);
    }
    else {
      expect(aUser.id).to.be.ok();
    }

    expect(aUser.name).to.be.ok();
    expect(aUser.picture).to.be.ok();

    expect(aUser.username).to.not.be.ok();
    expect(aUser.email).to.not.be.ok();
    expect(aUser.passports).to.not.be.ok();
  }

  function checkGroup(group, uidx){
    expect(group).to.be.an('object');

    expect(group.members).to.not.be.ok();
    expect(group.meetings).to.not.be.ok();

    expect(group.member.role).to.be.ok();
    expect(group.member.state).to.be.equal('active');
    expect(group.member.group).to.not.be.ok();

    checkUser(group.member.user, userAgents[uidx].user);
  }

  function checkMeeting(m, uidx){
    expect(m).to.be.an('object');

    expect(m.id).to.be.ok();
    expect(m.title).to.be.ok();

    expect(m.attendees).to.be.an('array');
    expect(m.attendees.length).to.be.equal(2);
    m.attendees.forEach(function(att, i){
      checkUser(att.user, userAgents[i].user);
    });

    expect(m.group).to.be.an('object');
    checkGroup(m.group, uidx);
  }

  function getMeeting(gidx, midx, uidx, status, done){
    var mid = groups[gidx].meetings[midx].id;

    userAgents[uidx]
      .get('/api/meetings/' + mid)
      .expect(status)
      .end(function(err, res){
        if (status === 200){
          expect(err).to.not.be.ok();
          checkMeeting(res.body, uidx);
        }

        done();
      });
  }

  it('Allow ROLE [owner]', function (done) {
    getMeeting(0, 0, 0, 200, done);
  });

  it('Allow ROLE [admin]', function (done) {
    getMeeting(0, 0, 1, 200, done);
  });

  it('Allow ROLE [moderator]', function (done) {
    getMeeting(0, 0, 2, 200, done);
  });

  it('Allow ROLE [member]', function (done) {
    getMeeting(0, 0, 3, 200, done);
  });

  it('Disallow STATE [pending]', function (done) {
    getMeeting(0, 0, 4, 404, done);
  });

  it('Disallow STATE [rejected]', function (done) {
    getMeeting(0, 0, 5, 404, done);
  });

  it('Disallow STATE [removed]', function (done) {
    getMeeting(0, 0, 6, 404, done);
  });

  it('Disallow user without a membership', function (done) {
    getMeeting(0, 0, 7, 404, done);
  });

});
