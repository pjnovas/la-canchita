
var builder = require('../builder');

describe('PUT /groups/:id/meetings/:id', function() {

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
        role: 'moderator',
        state: 'active'
      },{
        user: userAgents[4].user.id,
        role: 'member',
        state: 'active'
      },{
        user: userAgents[5].user.id,
        role: 'member',
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
      },{
        createdBy: groups[0].members[2].id,
        title: 'Meeting 2',
      },{
        createdBy: groups[0].members[3].id,
        title: 'Meeting 3',
      },{
        createdBy: groups[0].members[4].id,
        title: 'Meeting 4',
      },{
        createdBy: groups[0].members[5].id,
        title: 'Meeting 5',
      }]);

      groups[0].save(function(err, group){
        expect(group.meetings.length).to.be.equal(6);
        groups[0] = group;
        done();
      });
    });

  });

  afterEach(builder.clean);

  function sendUpdate(index, gIndex, mIndex, expected, done){
    var group = groups[gIndex];
    var gid = group.id;
    var mid = group.meetings[mIndex].id;

    userAgents[index]
      .put('/api/groups/' + gid + '/meetings/' + mid)
      .send({
        title: 'Meeting updated',
        group: 2, // try to hack the group
        createdBy: 5, // try to hack the createdBy
        attendees: [{ user: userAgents[0].user.id }] // try to hack attendees
      })
      .expect(expected)
      .end(function(err, res){
        if (err) return done(err);
        if (expected !== 200){
          return done();
        }

        expect(res.body).to.be.an('object');
        expect(res.body.title).to.be.equal('Meeting updated');
        expect(res.body.group.id).to.be.equal(gid);
        expect(res.body.createdBy.user).to.be.equal(userAgents[mIndex].user.id);
        expect(res.body.attendees.length).to.be.equal(0);
        done();
      });
  }

  it('Allow ROLE [owner]', function (done) {
    sendUpdate(0, 0, 0, 200, done);
  });

  it('Allow ROLE [owner] to update any other', function (done) {
    sendUpdate(0, 0, 2, 200, done);
  });

  it('Allow ROLE [admin] to update its own meeting', function (done) {
    sendUpdate(2, 0, 2, 200, done);
  });

  it('Allow ROLE [admin] to update other own meeting', function (done) {
    sendUpdate(2, 0, 3, 200, done);
  });

  it('Disallow ROLE [moderator] to update a meetin - Forbidden', function (done) {
    sendUpdate(3, 0, 4, 403, done);
  });

  it('Disallow ROLE [member] to update a meetin - Forbidden', function (done) {
    sendUpdate(4, 0, 5, 403, done);
  });

});
