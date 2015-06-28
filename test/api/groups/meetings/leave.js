
var builder = require('../builder');

describe('DELETE /meetings/:id/assistants/me', function() {

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
        assistants: [  groups[0].members[0] ]
      },{
        group: gid,
        createdBy: groups[0].members[1].id,
        title: 'Meeting 1',
        max: 2,
        assistants: [  groups[0].members[1] ]
      },{
        group: gid,
        createdBy: groups[0].members[2].id,
        title: 'Meeting 2',
        when: new Date(),
        assistants: [  groups[0].members[2] ]
      }];

      async.series(

        meetings.map(function(mdata){

          return function(_done){
            Meeting.create(mdata, function(err, meeting){
              Meeting.findOne({ id: meeting.id }).populateAll().exec(_done);
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
      .delete('/api/meetings/' + mid + '/assistants/me')
      .expect(expected)
      .end(done);
  }

  it('Allow a member to Leave as assistant', function (done) {
    sendLeave(0, 0, 0, 204, done);
  });

  it('Disallow a member to Leave as assistant if is not one - Conflict', function (done) {
    sendLeave(0, 0, 1, 409, done);
  });

  it('Disallow a member to Leave after the meeting date [when]', function (done) {
    sendLeave(2, 0, 2, 403, done);
  });

});