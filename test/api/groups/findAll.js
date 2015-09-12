
var builder = require('./builder');

describe('GET /groups', function() {
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
      }, {
        user: userAgents[2].user.id,
        role: 'member',
        state: 'active'
      }, {
        user: userAgents[3].user.id,
        role: 'member',
        state: 'pending',
        invitedBy: userAgents[0].user.id
      }]
    }, {
      title: 'Group Awesome 2',
      description: 'My cool group 2',
      picture: 'http://pic.com/pic2.png',
      members: [{
        user: userAgents[1].user.id,
        role: 'owner',
        state: 'active'
      }]
    }, {
      title: 'Other Awesome 3',
      description: 'My cool group 3',
      picture: 'http://pic.com/pic3.png',
      members: [{
        user: userAgents[0].user.id,
        role: 'owner',
        state: 'active'
      }]
    }, {
      title: 'Other Awesome REMOVED',
      description: 'My cool group 4',
      picture: 'http://pic.com/pic4.png',
      removed: true,
      members: [{
        user: userAgents[0].user.id,
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

  it('must return the groups where the user is member', function (done) {

    // get groups for user0
    userAgents[0]
      .get('/api/groups')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.be.equal(2);

        expect(res.body[0].id).to.be.equal(groups[0].id);

        done();
      });
  });

  it('must return the groups where the user is invited [pending]', function (done) {

    userAgents[3]
      .get('/api/groups')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.be.equal(1);

        var group = res.body[0];
        expect(group.id).to.be.equal(groups[0].id);

        expect(group.count.members).to.be.equal(3);
        expect(group.count.meetings).to.be.equal(0);

        expect(group.member.role).to.be.equal('member');
        expect(group.member.state).to.be.equal('pending');
        expect(group.member.createdAt).to.be.ok();
        expect(group.member.updatedAt).to.be.ok();

        expect(group.member.invitedBy).to.be.an('object');
        expect(group.member.invitedBy.id).to.be.ok();

        var aUser = group.member.invitedBy.user;
        expect(aUser).to.be.an('object');
        expect(aUser.id).to.be.equal(userAgents[0].user.id);
        expect(aUser.name).to.be.ok();
        expect(aUser.picture).to.be.ok();

        expect(aUser.username).to.not.be.ok();
        expect(aUser.email).to.not.be.ok();
        expect(aUser.passports).to.not.be.ok();

        done();
      });
  });

  it('must return owned groups no matter the search', function (done) {

    //TODO: check this to enable query search
    //http://irlnathan.github.io/sailscasts/blog/2014/01/14/sailscasts-answers-ep7-how-do-i-create-a-restful-json-crud-api-in-sails-from-scratch/

    // try a search query
    userAgents[0]
      .get("/api/groups?where={title:'Group'}")
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.be.equal(2);

        done();
      });
  });

  it('must return the groups with a [member] of the user', function (done) {

    // get groups for user0
    userAgents[0]
      .get('/api/groups')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.be.equal(2);

        var group = res.body[0];
        expect(group.id).to.be.equal(groups[0].id);

        expect(group.members).to.not.be.ok();
        expect(group.meetings).to.not.be.ok();

        expect(group.member).to.be.an('object');
        expect(group.member.role).to.be.equal('owner');
        expect(group.member.state).to.be.equal('active');

        expect(group.count).to.be.an('object');
        expect(group.count.members).to.be.equal(3);
        expect(group.count.meetings).to.be.equal(0);

        done();
      });
  });

});
