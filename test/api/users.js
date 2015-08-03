var expect = require('expect.js');

describe('\nUser ( ͡° ͜ʖ ͡°)\n', function() {

  describe('GET /users', function() {

    it('must return a colection of users', function (done) {

      userAgents[0]
        .get('/api/users')
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.equal(userAgents.length);
          done();
        });

    });

  });

  describe('GET /users/search?q=[keywords]', function() {

    before(function(done){
      // set user names for test search query

      var stores = [];

      _.pluck(userAgents, 'user').forEach(function(user, i){

        stores.push(function(cb){

          User
            .update(
              { id: user.id },
              {
                name: 'Firstname ' + i + ' Lastname',
                picture: 'test.png'
              }
            )
            .exec(cb);

        });

      });

      async.series(stores, done);

    });

    function search(query, done){
      userAgents[0]
        .get('/api/users/search?q=' + query)
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('array');
          done(res.body);
        });
    }

    function checkUsers(users){

      users.forEach(function(user){

        expect(user).to.be.an('object');
        expect(user.id).to.be.ok();
        expect(user.name).to.be.ok();
        expect(user.picture).to.be.ok();

        expect(user.username).to.not.be.ok();
        expect(user.email).to.not.be.ok();
        expect(user.passports).to.not.be.ok();
      });
    }

    it('must allow to search users by name with max', function (done) {
      var max = 10;
      var length = (userAgents.length > max ? max : userAgents.length);

      search('firstname', function(users){
        expect(users.length).to.be.equal(length);
        checkUsers(users);
        done();
      });

    });

    it('must allow to search users by name', function (done) {

      search('firstname 1 Lastname', function(users){
        expect(users.length).to.be.equal(1);
        checkUsers(users);
        done();
      });

    });

    it('must allow to search users by name as contain', function (done) {

      search('1 Lastname', function(users){
        expect(users.length).to.be.equal(1);
        checkUsers(users);
        done();
      });

    });

  });

  describe('GET /users/me', function() {

    it('must return the current user logged in', function (done) {

      userAgents[0]
        .get('/api/users/me')
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('object');
          expect(res.body.id).to.be.equal(userAgents[0].user.id);

          expect(res.body.passports).to.be.an('array');
          expect(res.body.passports.length).to.be.equal(1);
          expect(res.body.passports[0]).to.be.equal('local');

          done();
        });

    });

  });

  describe('PUT /users/me', function() {

    it('must update the current user logged in', function (done) {

      userAgents[0]
        .put('/api/users/me')
        .send({
          name: 'Crazy User',
          email: 'some@example.com',
          username: 'xxx-yyy'
        })
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).to.be.an('object');

          expect(res.body.id).to.be.equal(userAgents[0].user.id);
          expect(res.body.name).to.be.equal('Crazy User');
          expect(res.body.email).to.be.equal('some@example.com');

          // not allowed
          expect(res.body.username).to.be.equal(userAgents[0].user.username);
          done();
        });

    });

  });

});