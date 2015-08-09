
var async = require('async');
var request = require('supertest');

describe('(~˘▾˘)~  API  ~(˘▾˘~)', function() {
  expect = require('expect.js');
  testUsers = [];
  userAgents = [];

  before(function(done) {
    for (var i=0; i < 11; i++){
      testUsers.push({
        username: 'user' + i,
        email: 'user'+i+'@example.com',
        password: 'gWm6t2p'+i
      });
    }

    console.log('\nRegistering %s users ...', testUsers.length);

    async.parallel(

      testUsers.map(function(user){

        return function(cb){
          var agent = request.agent(sails.hooks.http.app);
          agent.post('/auth/local/register').send(user).end(function(err, res){
            agent.get('/api/users/me').end(function(err, res){
              agent.user = res.body;
              cb(null, agent);
            });
          });
        };

      })

    , function(err, agents){
      userAgents = agents;
      console.log('%s users registered and ready!\n', agents.length);
      done();
    });

  });

  require('./users');
  require('./groups');

});
