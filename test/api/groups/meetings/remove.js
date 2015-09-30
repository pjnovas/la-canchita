
var builder = require('../builder');

describe('DELETE /meetings/:id', function() {

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
      }, {
        createdBy: groups[0].members[2].id,
        title: 'Meeting Past',
        when: new Date()
      }, {
        createdBy: groups[0].members[2].id,
        title: 'Meeting Cancelled',
        cancelled: true
      }]);

      groups[0].save(function(err, group){
        expect(group.meetings.length).to.be.equal(8);
        groups[0] = group;
        done();
      });
    });

  });

  afterEach(builder.clean);

  function sendRemove(index, gIndex, mIndex, expected, done){
    var group = groups[gIndex];
    var gid = group.id;
    var mid = group.meetings[mIndex].id;

    userAgents[index]
      .delete('/api/meetings/' + mid)
      .expect(expected)
      .end(function(err, res){
        if (err) return done(err);
        if (expected !== 204){
          return done();
        }

        if (expected === 204){

          Meeting.findOne({ id: mid }).exec(function(err, meeting){
            expect(err).to.not.be.ok();
            expect(meeting).to.not.be.ok();
            done();
          });

          return;
        }

      });
  }

  function sendJoin(index, gIndex, mIndex, expected, done){
    var group = groups[gIndex];
    var gid = group.id;
    var mid = group.meetings[mIndex].id;

    userAgents[index]
      .post('/api/meetings/' + mid + '/attendees/me')
      .expect(expected)
      .end(function(err, res){
        expect(err).to.not.be.ok();
        expect(res.body).to.be.an('object');
        expect(res.body.id).to.be.ok();
        expect(res.body.user.id).to.be.equal(userAgents[index].user.id);
        done();
      });
  }

  it('Allow ROLE [owner]', function (done) {
    sendRemove(0, 0, 0, 204, done);
  });

  it('Allow ROLE [owner] to remove any other', function (done) {
    sendRemove(0, 0, 2, 204, done);
  });

  // Admin

  it('Allow ROLE [admin] to remove its own meeting', function (done) {
    sendRemove(2, 0, 2, 204, done);
  });

  it('Disallow ROLE [admin] to remove a non own meeting - Forbidden', function (done) {
    sendRemove(2, 0, 4, 403, done);
  });

  it('Disallow ROLE [moderator] to remove a meetin - Forbidden', function (done) {
    sendRemove(3, 0, 4, 403, done);
  });

  it('Disallow ROLE [member] to remove a meetin - Forbidden', function (done) {
    sendRemove(4, 0, 5, 403, done);
  });

  it('Must set meeting as cancelled if have more than 2 attendees', function (done) {
    var mIndex = 2;
    var mid = groups[0].meetings[mIndex].id;

    sendJoin(3, 0, mIndex, 200, function(){ //join user 3
      sendJoin(4, 0, mIndex, 200, function(){ //join user 4

        sendRemove(2, 0, mIndex, 200, function(){ //send a remove from user 2 (creator)

          Meeting.findOne({ id: mid }).exec(function(err, meeting){
            expect(err).to.not.be.ok();

            expect(meeting).to.be.ok();
            expect(meeting.cancelled).to.be.true;

            done();
          });

        });
      });
    });
  });

  it('Disallow if meeting is in the past', function (done) {
    sendRemove(2, 0, 6, 403, done);
  });

  it('Disallow if meeting is cancelled', function (done) {
    sendRemove(2, 0, 7, 403, done);
  });

});
