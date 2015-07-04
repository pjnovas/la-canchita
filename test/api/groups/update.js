
var builder = require('./builder');

describe('PUT /groups/:id', function() {

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
      },{
        user: userAgents[4].user.id,
        role: 'admin',
        state: 'pending'
      },{
        user: userAgents[5].user.id,
        role: 'admin',
        state: 'rejected'
      },{
        user: userAgents[6].user.id,
        role: 'admin',
        state: 'removed'
      }]
    }, {
      title: 'Group Awesome 2',
      description: 'My cool group 2',
      members: [{
        user: userAgents[7].user.id,
        role: 'owner',
        state: 'active'
      }]
    }];

    builder.create(groups_data, function(err, _groups){
      groups = _groups;
      done();
    });

  });

  after(builder.clean);

  function getUpdate(index){
    return {
      title: 'Title ' + index,
      description: 'Description ' + index,
      picture: 'http://pic.com/pic' + index + '.png'
    };
  }

  function checkUpdate(g, index){
    expect(g).to.be.an('object');

    expect(g.title).to.be.equal('Title ' + index);
    expect(g.description).to.be.equal('Description ' + index);
    expect(g.picture).to.not.be.ok();

    expect(g.members).to.be.an('array');
    expect(g.members.length).to.be.equal(7);
  }

  function sendUpdateBy(index, gid, expected, done){
    userAgents[index]
      .put('/api/groups/' + gid)
      .send(getUpdate(index))
      .expect(expected)
      .end(done);
  }

  it('Allow ROLE [owner]', function (done) {

    sendUpdateBy(0, groups[0].id, 200, function(err, res){
      if (err) done(err);
      checkUpdate(res.body, 0);
      done();
    });

  });

  it('Allow ROLE [admin]', function (done) {

    sendUpdateBy(1, groups[0].id, 200, function(err, res){
      if (err) done(err);
      checkUpdate(res.body, 1);
      done();
    });

  });

  it('Disallow ROLE [moderator] - Forbidden', function (done) {
    sendUpdateBy(2, groups[0].id, 403, done);
  });

  it('Disallow ROLE [member] - Forbidden', function (done) {
    sendUpdateBy(3, groups[0].id, 403, done);
  });

  it('Disallow STATE [pending] - NotFound', function (done) {
    sendUpdateBy(4, groups[0].id, 404, done);
  });

  it('Disallow STATE [rejected] - NotFound', function (done) {
    sendUpdateBy(5, groups[0].id, 404, done);
  });

  it('Disallow STATE [removed] - NotFound', function (done) {
    sendUpdateBy(6, groups[0].id, 404, done);
  });

  it('Disallow Non Member - NotFound', function (done) {
    sendUpdateBy(7, groups[0].id, 404, done);
  });

});