
var builder = require('../builder');

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
        user: userAgents[1].user.id, // Invited A
        role: 'member',
        state: 'pending'
      },{
        user: userAgents[2].user.id, // Existance
        role: 'member',
        state: 'active'
      },{
        user: userAgents[3].user.id, // Rejected
        role: 'member',
        state: 'rejected'
      },{
        user: userAgents[4].user.id, // Removed
        role: 'member',
        state: 'removed'
      },{
        user: userAgents[5].user.id, // left
        role: 'member',
        state: 'left'
      }]
    }];

    builder.create(groups_data, function(err, _groups){
      groups = _groups;
      done();
    });

  });

  after(builder.clean);

  function checkMember(gid, uid, state, done){
    Membership
      .findOne({ group: gid, user: uid })
      .exec(function(err, m){
        if (err) done(err);

        expect(m.id).to.be.ok();
        expect(m.user).to.be.equal(uid);
        expect(m.group).to.be.equal(gid);

        expect(m.role).to.be.equal('member');
        expect(m.state).to.be.equal(state);

        done();
      });
  }

  it('Allow to reject an Invitation', function (done) {
    var gid = groups[0].id;

    userAgents[1]
      .delete('/api/groups/' + gid + '/members/me')
      .expect(204)
      .end(function(err, res){
        if (err) done(err);
        expect(res.body).to.be.empty();
        checkMember(gid, userAgents[1].user.id, 'rejected', done);
      });
  });

  it('Allow to leave a Group', function (done) {
    var gid = groups[0].id;

    userAgents[2]
      .delete('/api/groups/' + gid + '/members/me')
      .expect(204)
      .end(function(err, res){
        if (err) done(err);
        expect(res.body).to.be.empty();
        checkMember(gid, userAgents[2].user.id, 'left', done);
      });
  });

  it('Disallow if is rejected - NotFound', function (done) {

    userAgents[3]
      .delete('/api/groups/' + groups[0].id + '/members/me')
      .expect(404)
      .end(done);
  });

  it('Disallow if is removed - NotFound', function (done) {

    userAgents[4]
      .delete('/api/groups/' + groups[0].id + '/members/me')
      .expect(404)
      .end(done);
  });

  it('Disallow if is left - NotFound', function (done) {

    userAgents[5]
      .delete('/api/groups/' + groups[0].id + '/members/me')
      .expect(404)
      .end(done);
  });

  it('Disallow if no Invitation - NotFound', function (done) {

    userAgents[6]
      .delete('/api/groups/' + groups[0].id + '/members/me')
      .expect(404)
      .end(done);
  });

});