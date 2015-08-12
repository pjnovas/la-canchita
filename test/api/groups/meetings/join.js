
var builder = require('../builder');

describe('POST /meetings/:id/attendees/me', function() {

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
        max: 2,
      },{
        createdBy: groups[0].members[2].id,
        title: 'Meeting 2',
        max: 2,
        replacements: true,
      },{
        createdBy: groups[0].members[3].id,
        title: 'Meeting 3',
        when: new Date()
      }]);

      groups[0].save(function(err, group){
        groups[0] = group;
        done();
      });
    });

  });

  afterEach(builder.clean);

  function sendJoin(index, gIndex, mIndex, expected, done){
    var group = groups[gIndex];
    var gid = group.id;
    var mid = group.meetings[mIndex].id;

    userAgents[index]
      .post('/api/meetings/' + mid + '/attendees/me')
      .expect(expected)
      .end(function(err, res){
        if (expected === 200){
          expect(err).to.not.be.ok();
          expect(res.body).to.be.an('object');
          expect(res.body.id).to.be.ok();
          expect(res.body.user).to.be.equal(userAgents[index].user.id);
        }
        done();
      });
  }

  it('Allow a member to Join as attendee', function (done) {
    sendJoin(0, 0, 0, 200, done);
  });

  it('Disallow to Join as attendee twice - Conflict', function (done) {
    sendJoin(0, 0, 0, 200, function(){
      sendJoin(0, 0, 0, 409, done);
    });
  });

  it('Disallow a NON member to Join as attendee', function (done) {
    sendJoin(10, 0, 0, 404, done);
  });

  it('Disallow to Join more than max - Conflict', function (done) {
    sendJoin(0, 0, 1, 200, function(){
      sendJoin(1, 0, 1, 200, function(){
        sendJoin(2, 0, 1, 403, done);
      });
    });
  });

  it('Allow to Join more than max if it has replacements', function (done) {
    sendJoin(0, 0, 2, 200, function(){
      sendJoin(1, 0, 2, 200, function(){
        sendJoin(2, 0, 2, 200, done);
      });
    });
  });

  it('Disallow to Join after the meeting date [when]', function (done) {
    sendJoin(0, 0, 3, 403, done);
  });

});
