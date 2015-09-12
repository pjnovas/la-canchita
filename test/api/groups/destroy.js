
var builder = require('./builder');

describe('DELETE /groups/:id', function() {

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
      }]
    }, {
      title: 'Group Awesome 2',
      description: 'My cool group 2',
      members: [{
        user: userAgents[4].user.id,
        role: 'owner',
        state: 'active'
      },{
        user: userAgents[5].user.id,
        role: 'owner',
        state: 'active'
      }]
    }, {
      title: 'Group Awesome 3',
      description: 'My cool group 3',
      members: [{
        user: userAgents[4].user.id,
        role: 'owner',
        state: 'active'
      }]
    }];

    builder.create(groups_data, function(err, _groups){
      groups = _groups;

      groups[0].meetings.add([{
        createdBy: groups[0].members[0].id,
        title: 'Meeting 0',
      },{
        createdBy: groups[0].members[1].id,
        title: 'Meeting 1',
      }]);

      groups[1].meetings.add([{
        createdBy: groups[1].members[0].id,
        title: 'Meeting 0',
      },{
        createdBy: groups[1].members[0].id,
        title: 'Meeting 1',
      }]);

      groups[2].meetings.add([{
        createdBy: groups[2].members[0].id,
        title: 'Meeting 0',
      },{
        createdBy: groups[2].members[0].id,
        title: 'Meeting 1',
      }]);

      groups[0].save(function(err, group){
        groups[1].save(function(err, group){
          groups[2].save(function(err, group){
            done();
          });
        });
      });

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

        done();
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

  it('Allow ROLE [owner] with more than 1 member - logical remove', function (done) {
    var gid = groups[0].id;
    sendDeleteBy(0, gid, 204, function(){
      Group.findOne({ id: gid }, function(err, group){
        if (err) return done(err);
        expect(group).to.be.ok();
        expect(group.removed).to.be.equal(true);
        done();
      });
    });
  });

  it('Allow ROLE [owner] with only itself as member - physical remove', function (done) {
    var gid = groups[2].id;
    sendDeleteBy(4, gid, 204, function(){
      Group.findOne({ id: gid }, function(err, group){
        if (err) return done(err);
        expect(group).to.not.be.ok();
        done();
      });
    });
  });

  it('Disallow ROLE [owner] with other Owners in the group', function (done) {
    sendDeleteBy(4, groups[1].id, 403, done);
  });

});
