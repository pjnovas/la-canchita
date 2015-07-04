
var builder = require('./builder');

describe('POST /groups', function() {

  after(builder.clean);

  it('must create a group and set user as Owner', function (done) {

    var group = {
      title: 'Group Awesome',
      description: 'My cool group',
      picture: 'http://test.com/picture.png'
    };

    userAgents[0]
      .post('/api/groups')
      .send(group)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        var g = res.body;
        expect(g).to.be.an('object');

        for (var p in group){
          if (p !== 'picture'){
            expect(g[p]).to.be.equal(group[p]);
          }
        }

        expect(g.picture).to.not.be.ok();
        expect(g.members).to.be.an('array');
        expect(g.members.length).to.be.equal(1);

        var me = g.members[0];

        expect(me).to.be.an('object');
        expect(me.user).to.be.an('object');
        expect(me.user.id).to.be.equal(userAgents[0].user.id);
        expect(me.role).to.be.equal('owner');
        expect(me.state).to.be.equal('active');
        expect(me.group).to.be.an('object');
        expect(me.group.id).to.be.equal(g.id);

        done();
      });

  });

});
