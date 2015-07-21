
var builder = require('../builder');

describe('GET /groups/:id/members', function() {

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
      },{
        user: userAgents[4].user.id,
        role: 'member',
        state: 'pending'
      },{
        user: userAgents[5].user.id,
        role: 'member',
        state: 'rejected'
      },{
        user: userAgents[6].user.id,
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

  function send(gIndex, uIndex, expected, done) {
    var group = groups[gIndex];

    userAgents[uIndex]
      .get('/api/groups/' + group.id + '/members')
      .expect(expected)
      .end(function(err, res){
        if (expected !== 200){
          return done();
        }

        expect(res.body).to.be.an('array');
        expect(res.body.length).to.be.equal(group.members.length);
        done();
      });
  }

  it('Allow ROLE [owner]', function (done) {
    send(0, 0, 200, done);
  });

  it('Allow ROLE [admin]', function (done) {
    send(0, 1, 200, done);
  });

  it('Allow ROLE [moderator]', function (done) {
    send(0, 2, 200, done);
  });

  it('Allow ROLE [member]', function (done) {
    send(0, 3, 200, done);
  });

  it('Disallow STATE [pending] - NotFound', function (done) {
    send(0, 4, 404, done);
  });

  it('Disallow STATE [rejected] - NotFound', function (done) {
    send(0, 5, 404, done);
  });

  it('Disallow STATE [removed] - NotFound', function (done) {
    send(0, 6, 404, done);
  });

  it('Disallow Non Member - NotFound', function (done) {
    send(0, 0, 404, done);
  });

});