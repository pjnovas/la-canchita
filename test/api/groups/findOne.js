
var builder = require('./builder');

describe('GET /groups/:id', function() {

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
      done();
    });

  });

  after(builder.clean);

  function checkGroup(group){
    expect(group).to.be.an('object');

    expect(group.members).to.not.be.ok();
    expect(group.meetings).to.not.be.ok();

    expect(group.member.role).to.be.equal('owner');
    expect(group.member.state).to.be.equal('active');

    var aUser = group.member.user;
    var user = userAgents[0].user;

    expect(aUser).to.be.an('object');
    expect(aUser.id).to.be.equal(user.id);
    expect(aUser.name).to.be.ok();
    expect(aUser.picture).to.be.ok();

    expect(aUser.username).to.not.be.ok();
    expect(aUser.email).to.not.be.ok();
    expect(aUser.passports).to.not.be.ok();
  }

  it('Allow ROLE [owner]', function (done) {

    userAgents[0]
      .get('/api/groups/' + groups[0].id)
      .expect(200)
      .end(function(err, res){
        expect(err).to.not.be.ok();
        checkGroup(res.body);
        done();
      });
  });

  it('Allow ROLE [admin]', function (done) {

    userAgents[1]
      .get('/api/groups/' + groups[0].id)
      .expect(200)
      .end(done);
  });

  it('Allow ROLE [moderator]', function (done) {

    userAgents[2]
      .get('/api/groups/' + groups[0].id)
      .expect(200)
      .end(done);
  });

  it('Allow ROLE [member]', function (done) {

    userAgents[3]
      .get('/api/groups/' + groups[0].id)
      .expect(200)
      .end(done);
  });

  it('Disallow STATE [pending]', function (done) {

    userAgents[4]
      .get('/api/groups/' + groups[0].id)
      .expect(404)
      .end(done);
  });

  it('Disallow STATE [rejected]', function (done) {

    userAgents[5]
      .get('/api/groups/' + groups[0].id)
      .expect(404)
      .end(done);
  });

  it('Disallow STATE [removed]', function (done) {

    userAgents[6]
      .get('/api/groups/' + groups[0].id)
      .expect(404)
      .end(done);
  });

  it('Disallow user without a membership', function (done) {

    userAgents[7]
      .get('/api/groups/' + groups[0].id)
      .expect(404)
      .end(done);
  });

});