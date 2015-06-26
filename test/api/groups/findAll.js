
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
    }, {
      title: 'Other Awesome 3',
      description: 'My cool group 3',
      picture: 'http://pic.com/pic3.png',
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

        res.body.forEach(function(g){
          expect(g.members[0].user).to.be.equal(userAgents[0].user.id);
        });

        done();
      });
  });

});