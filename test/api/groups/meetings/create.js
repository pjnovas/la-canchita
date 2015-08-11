
var builder = require('../builder');

describe('POST /groups/:id/meetings', function() {

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
    }];

    builder.create(groups_data, function(err, _groups){
      groups = _groups;
      done();
    });

  });

  after(builder.clean);

  function getMemberId(gid, uid, done){
    Membership.findOne({ group: gid, user: uid }).exec(done);
  }

  function checkUpdate(m, gid, uid, index, done){
    expect(m).to.be.an('object');

    expect(m.id).to.be.ok();
    expect(m.group).to.be.equal(gid);
    expect(m.title).to.be.equal('test title');
    expect(m.info).to.be.equal('test info');
    expect(m.place).to.be.equal('Some cool place');
    expect(m.location).to.be.an('array');
    expect(m.location[0]).to.be.equal(-10.50);
    expect(m.location[1]).to.be.equal(-34.88);
    expect(new Date(m.when)).to.be.greaterThan(new Date()); // defaults to next week

    expect(m.duration).to.be.an('object');
    expect(m.duration.times).to.be.equal(5);
    expect(m.duration.period).to.be.equal('hours');

    expect(m.confirmation).to.be.equal(true);
    expect(m.confirmStart).to.be.an('object');
    expect(m.confirmStart.times).to.be.equal(1);
    expect(m.confirmStart.period).to.be.equal('weeks');
    expect(m.confirmEnd).to.be.an('object');
    expect(m.confirmEnd.times).to.be.equal(2);
    expect(m.confirmEnd.period).to.be.equal('days');

    getMemberId(groups[0].id, userAgents[index].user.id, function(err, creator){
      expect(m.createdBy).to.be.equal(creator.id);
      done();
    });
  }

  function sendCreateMeeting(index, gid, uid, expected, done){
    userAgents[index]
      .post('/api/groups/' + gid + '/meetings')
      .send({
        title: 'test title',
        info: 'test info',
        place: 'Some cool place',
        location: [ -10.50, -34.88 ],
        confirmation: true,
        confirmStart: { times: 1, period: 'weeks' },
        confirmEnd: { times: 2, period: 'days' },
        duration: { times: 5, period: 'hours' }
      })
      .expect(expected)
      .end(done);
  }

  it('Allow ROLE [owner]', function (done) {
    var gid = groups[0].id;
    var uid = 8;

    sendCreateMeeting(0, gid, uid, 200, function(err, res){
      if (err) done(err);
      checkUpdate(res.body, gid, uid, 0, done);
    });

  });

  it('Allow ROLE [admin]', function (done) {
    var gid = groups[0].id;
    var uid = 9;

    sendCreateMeeting(1, gid, uid, 200, function(err, res){
      if (err) done(err);
      checkUpdate(res.body, gid, uid, 1, done);
    });

  });

  it('Disallow ROLE [moderator] - Forbidden', function (done) {
    sendCreateMeeting(2, groups[0].id, 10, 403, done);
  });

  it('Disallow ROLE [member] - Forbidden', function (done) {
    sendCreateMeeting(3, groups[0].id, 12, 403, done);
  });

});