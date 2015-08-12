
var builder = require('../builder');

describe('DELETE /meetings/:id/attendees/me', function() {

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
      }]
    }];

    builder.create(groups_data, function(err, _groups){
      groups = _groups;
      var gid = groups[0].id;

      var meetings = [{
        group: gid,
        createdBy: groups[0].members[0].id,
        title: 'Meeting 0',
      },{
        group: gid,
        createdBy: groups[0].members[1].id,
        title: 'Meeting 1',
        max: 2,
      },{
        group: gid,
        createdBy: groups[0].members[2].id,
        title: 'Meeting 2',
        when: new Date(),
      },{
        group: gid,
        createdBy: groups[0].members[3].id,
        title: 'Meeting 3',
      }];

      async.series(

        meetings.map(function(mdata, i){

          return function(_done){
            Meeting.create(mdata, function(err, meeting){

              var att = {
                user: groups[0].members[i].user,
                meeting: meeting.id
              };

              if (i === 3) { att.isConfirmed = true; }

              meeting.attendees.add(att);

              meeting.save(function(err, meeting){
                if (err) throw err;
                Meeting.findOne({ id: meeting.id }).populateAll().exec(_done);
              });

            });
          };

        })

      , function(err, meetings){
        groups[0].meetings.add(meetings);
        groups[0].save(function(err, group){
          groups[0] = group;
          done(err);
        });
      });

    });

  });

  afterEach(builder.clean);

  function sendLeave(index, gIndex, mIndex, expected, done){
    var group = groups[gIndex];
    var gid = group.id;
    var mid = group.meetings[mIndex].id;

    userAgents[index]
      .delete('/api/meetings/' + mid + '/attendees/me')
      .expect(expected)
      .end(function(err, res){
        if (expected === 204){
          expect(err).to.not.be.ok();
        }
        done();
      });
  }

  it('Allow a member to Leave as attendee', function (done) {
    sendLeave(0, 0, 0, 204, done);
  });

  it('Disallow a member to Leave as attendee if is not one - Conflict', function (done) {
    sendLeave(0, 0, 1, 409, done);
  });

  it('Disallow a member to Leave after the meeting date [when]', function (done) {
    sendLeave(2, 0, 2, 403, done);
  });

  it('Disallow a member to Leave if is Confirmed', function (done) {
    sendLeave(3, 0, 3, 409, done);
  });

});
