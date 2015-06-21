var expect = require('expect.js');

describe('\nUser ( ͡° ͜ʖ ͡°)\n', function() {

  describe('GET /users', function() {

    it('must return a colection of users', function (done) {

      global.userAgents[0]
        .get('/api/users')
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.equal(global.userAgents.length);
          done();
        });

    });

  });

  describe('GET /users/me', function() {

    it('must return the current user logged in', function (done) {

      global.userAgents[0]
        .get('/api/users/me')
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('object');
          expect(res.body.id).to.be.equal(global.userAgents[0].user.id);
          done();
        });

    });

  });
});