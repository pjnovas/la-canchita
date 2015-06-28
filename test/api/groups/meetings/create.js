
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
    expect(new Date(m.when)).to.be.greaterThan(new Date()); // defaults to next week

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
        place: 'Some cool place'
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