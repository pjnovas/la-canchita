
var builder = require('./builder');

describe('POST /groups/:id/members/me', function() {

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
        user: userAgents[1].user.id, // Invited
        role: 'member',
        state: 'pending'
      }]
    }];

    builder.create(groups_data, function(err, _groups){
      groups = _groups;
      done();
    });

  });

  after(builder.clean);

  it('Allow to accept an Invitation', function (done) {
    var gid = groups[0].id;

    userAgents[1]
      .post('/api/groups/' + gid + '/members/me')
      .expect(200)
      .end(function(err, res){
        if (err) done(err);

        var m = res.body;
        expect(m).to.be.an('object');

        expect(m.id).to.be.ok();
        expect(m.user.id).to.be.equal(userAgents[1].user.id);
        expect(m.group.id).to.be.equal(gid);

        expect(m.role).to.be.equal('member');
        expect(m.state).to.be.equal('active');

        done();
      });
  });

  it('Disallow if no Invitation - NotFound', function (done) {

    userAgents[2]
      .post('/api/groups/' + groups[0].id + '/members/me')
      .expect(404)
      .end(done);
  });

  it('Disallow if is already active - Conflict', function (done) {

    userAgents[0]
      .post('/api/groups/' + groups[0].id + '/members/me')
      .expect(409)
      .end(done);
  });

  it('State [rejected] ???');
  it('State [removed] ???');

});