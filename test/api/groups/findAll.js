
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
        expect(res.body.length).to.be.equal(1);

        expect(res.body[0].id).to.be.equal(groups[0].id);

        done();
      });
  });

  it('must return owned groups no matter the search'/*, function (done) {

    // try a search query
    userAgents[1]
      .get("/api/groups?where={title:'Group'}")
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.be.equal(0);
        done();
      });
  }*/);

});