
var builder = require('../builder');
var moment = require('moment');

describe('POST /meetings/:id/confirmed/me', function() {

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
      },{
        user: userAgents[6].user.id,
        role: 'member',
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
        confirmation: true,
        assistants: [  groups[0].members[0] ]
      },{
        group: gid,
        createdBy: groups[0].members[1].id,
        title: 'Meeting 1',
        confirmation: true,
        replacement: true,
        max: 2,
        assistants: [
          groups[0].members[0],
          groups[0].members[1],
          groups[0].members[2]
        ]
      },{
        group: gid,
        createdBy: groups[0].members[2].id,
        title: 'Meeting 2',
        confirmation: true,
        when: moment().toDate(),
        assistants: [  groups[0].members[2] ]
      },{
        group: gid,
        createdBy: groups[0].members[3].id,
        title: 'Meeting 3',
        // not enabled confirmation
        assistants: [  groups[0].members[3] ]
      },{
        group: gid,
        createdBy: groups[0].members[4].id,
        title: 'Meeting 4',
        when: moment().add(5, 'days').toDate(),
        confirmation: true,
        confirmationStart: moment().subtract(1, 'days').toDate(), // yestarday
        confirmationEnd: moment().add(1, 'days').toDate(), // tomorrow
        assistants: [  groups[0].members[4] ]
      },{
        group: gid,
        createdBy: groups[0].members[5].id,
        title: 'Meeting 5',
        when: moment().add(5, 'days').toDate(),
        confirmation: true,
        confirmationStart: moment().subtract(3, 'days').toDate(),
        confirmationEnd: moment().subtract(2, 'days').toDate(),
        assistants: [  groups[0].members[5] ]
      },{
        group: gid,
        createdBy: groups[0].members[6].id,
        title: 'Meeting 6',
        when: moment().add(5, 'days').toDate(),
        confirmation: true,
        confirmationStart: moment().add(1, 'days').toDate(), // tomorrow
        confirmationEnd: moment().add(2, 'days').toDate(), // after tomorrow
        assistants: [  groups[0].members[6] ]
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

  function sendConfirm(index, gIndex, mIndex, expected, done){
    var group = groups[gIndex];
    var gid = group.id;
    var mid = group.meetings[mIndex].id;

    userAgents[index]
      .post('/api/meetings/' + mid + '/confirmed/me')
      .expect(expected)
      .end(done);
  }

  it('Allow a member to Confirm as assistant', function (done) {
    sendConfirm(0, 0, 0, 204, done);
  });

  it('Disallow a member to Confirm if is not as assistant', function (done) {
    sendConfirm(1, 0, 0, 409, done);
  });

  it('Disallow to Confirn as assistant twice - Conflict', function (done) {
    sendConfirm(0, 0, 0, 204, function(){
      sendConfirm(0, 0, 0, 409, done);
    });
  });

  it('Disallow a NON member to Confirm as assistant', function (done) {
    sendConfirm(10, 0, 0, 404, done);
  });

  it('Disallow if confirmation is disabled', function (done) {
    sendConfirm(3, 0, 3, 403, done);
  });

  it('Allow to Confirm more than max if it has replacement', function (done) {
    sendConfirm(0, 0, 1, 204, function(){
      sendConfirm(1, 0, 1, 204, function(){
        sendConfirm(2, 0, 1, 204, done);
      });
    });
  });

  it('Disallow to Confirm after the meeting date [when]', function (done) {
    sendConfirm(2, 0, 2, 403, done);
  });

  it('Allow to Confirm in bewtween dates of confirmations', function (done) {
    sendConfirm(4, 0, 4, 204, done);
  });

  it('Disallow to Confirm after the confirmation date [confirmationEnd]', function (done) {
    sendConfirm(5, 0, 5, 403, done);
  });

  it('Disallow to Confirm before the confirmation date [confirmationStart]', function (done) {
    sendConfirm(6, 0, 6, 403, done);
  });

});