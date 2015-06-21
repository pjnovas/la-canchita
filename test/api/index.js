
var async = require('async');
var request = require('supertest');
var expect = require('expect.js');

var testUsers = [
  { username: 'userA', email: 'userA@lacanchita.com', password: 'gWm6t2p1' },
  { username: 'userB', email: 'userB@lacanchita.com', password: 'gWm6t2p2' },
  { username: 'userC', email: 'userC@lacanchita.com', password: 'gWm6t2p3' },
  { username: 'userD', email: 'userD@lacanchita.com', password: 'gWm6t2p4' },
  { username: 'userE', email: 'userE@lacanchita.com', password: 'gWm6t2p5' },
];

global.userAgents = [];

describe('(~˘▾˘)~  API  ~(˘▾˘~)', function() {

  before(function(done) {
    console.log('\nRegistering %s users ...', testUsers.length);

    async.parallel(

      testUsers.map(function(user){

        return function(cb){
          var agent = request.agent(sails.hooks.http.app);
          agent.post('/auth/local/register').send(user).end(function(err, res){
            console.log('%s is now registered', user.username);
            agent.get('/api/users/me').end(function(err, res){
              agent.user = res.body;
              cb(null, agent);
            });
          });
        };

      })

    , function(err, agents){
      global.userAgents = agents;
      console.log('%s users registered!\n', agents.length);
      done();
    });

  });

  require('./users');
  require('./groups');

});
