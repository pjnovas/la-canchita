
var builder = require('./builder');

describe('DELETE /groups/:id', function() {

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
      }]
    }, {
      title: 'Group Awesome 2',
      description: 'My cool group 2',
      picture: 'http://pic.com/pic2.png',
      members: [{
        user: userAgents[4].user.id,
        role: 'owner',
        state: 'active'
      },{
        user: userAgents[5].user.id,
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

  function sendDeleteBy(index, gid, expected, done){
    userAgents[index]
      .delete('/api/groups/' + gid)
      .expect(expected)
      .end(function(err, res){
        if (err) return done(err);
        if (expected !== 204) return done();

        Group.findOne({ id: gid }, function(err, group){
          if (err) return done(err);
          expect(group).to.not.be.ok();
          done();
        });
      });
  }

  it('Disallow ROLE [admin] - Forbidden', function (done) {
    sendDeleteBy(1, groups[0].id, 403, done);
  });

  it('Disallow ROLE [moderator] - Forbidden', function (done) {
    sendDeleteBy(2, groups[0].id, 403, done);
  });

  it('Disallow ROLE [member] - Forbidden', function (done) {
    sendDeleteBy(3, groups[0].id, 403, done);
  });

  it('Disallow Non Member - NotFound', function (done) {
    sendDeleteBy(4, groups[0].id, 404, done);
  });

  it('Allow ROLE [owner] with no other Owners in the group', function (done) {
    sendDeleteBy(0, groups[0].id, 204, done);
  });

  it('Disallow ROLE [owner] with other Owners in the group', function (done) {
    sendDeleteBy(4, groups[1].id, 403, done);
  });

});