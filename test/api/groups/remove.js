
var builder = require('./builder');

describe('DELETE /groups/:id/members/:id', function() {

  var groups;

  beforeEach(function(done){

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
        role: 'owner',
        state: 'active'
      },{
        user: userAgents[2].user.id,
        role: 'admin',
        state: 'active'
      },{
        user: userAgents[3].user.id,
        role: 'admin',
        state: 'active'
      },{
        user: userAgents[4].user.id,
        role: 'moderator',
        state: 'active'
      },{
        user: userAgents[5].user.id,
        role: 'member',
        state: 'active'
      },{
        user: userAgents[6].user.id,
        role: 'member',
        state: 'active'
      },{
        user: userAgents[7].user.id,
        role: 'member',
        state: 'pending'
      },{
        user: userAgents[8].user.id,
        role: 'member',
        state: 'rejected'
      },{
        user: userAgents[9].user.id,
        role: 'member',
        state: 'removed'
      }]
    }, {
      title: 'Group Awesome 2',
      description: 'My cool group 2',
      picture: 'http://pic.com/pic2.png',
      members: [{
        user: userAgents[10].user.id,
        role: 'owner',
        state: 'active'
      }]
    }];

    builder.create(groups_data, function(err, _groups){
      groups = _groups;
      done();
    });

  });

  afterEach(builder.clean);

  function getMemberId(gid, uid, done){
    Membership.findOne({ group: gid, user: uid }).exec(done);
  }

  function sendRemove(index, gid, uIndex, expected, done){
    var uid = userAgents[uIndex].user.id;

    getMemberId(gid, uid, function(err, member){
      if (err) return done(err);
      var mid = member.id;

      userAgents[index]
        .delete('/api/groups/' + gid + '/members/' + mid)
        .expect(expected)
        .end(function(err, res){
          if (err) return done(err);
          if (expected !== 200){
            return done();
          }

          if (expected === 204){
            Membership.findOne({ id: mid }).exec(function(err, member){
              // physical removed
              expect(err).to.not.be.ok();
              expect(member).to.not.be.ok();
              done();
            });

            return;
          }

          if (expected === 200){
            Membership.findOne({ id: mid }).exec(function(err, member){
              expect(member.state).to.be.equal('removed');

              getMemberId(gid, userAgents[index].user.id, function(err, remover){
                expect(member.removedBy).to.be.equal(remover.id);
                done();
              });
            });
          }

        });
    })
  }

  it('Allow ROLE [owner]', function (done) {
    sendRemove(0, groups[0].id, 2, 200, done);
  });

  it('Disallow ROLE [owner] to remove [owner]', function (done) {
    sendRemove(0, groups[0].id, 1, 403, done);
  });

  // Admin

  it('Allow ROLE [admin] to remove [moderator]', function (done) {
    sendRemove(2, groups[0].id, 4, 200, done);
  });

  it('Allow ROLE [admin] to remove [member]', function (done) {
    sendRemove(2, groups[0].id, 5, 200, done);
  });

  it('Disallow ROLE [admin] to remove [admin]', function (done) {
    sendRemove(2, groups[0].id, 3, 403, done);
  });

  it('Disallow ROLE [admin] to remove [owner]', function (done) {
    sendRemove(2, groups[0].id, 1, 403, done);
  });

  // Cannot remove any

  it('Disallow ROLE [moderator] - Forbidden', function (done) {
    sendRemove(4, groups[0].id, 5, 403, done);
  });

  it('Disallow ROLE [member] - Forbidden', function (done) {
    sendRemove(5, groups[0].id, 6, 403, done);
  });

  it('Allow STATE [pending] - Physical remove', function (done) {
    sendRemove(2, groups[0].id, 7, 204, done);
  });

  it('Allow STATE [rejected] - Physical remove', function (done) {
    sendRemove(2, groups[0].id, 8, 204, done);
  });

  it('Disallow STATE [removed] - NotFound', function (done) {
    sendRemove(2, groups[0].id, 9, 404, done);
  });

  it('Disallow Non Member (owner removing a member) - NotFound', function (done) {
    sendRemove(10, groups[0].id, 5, 404, done);
  });

});