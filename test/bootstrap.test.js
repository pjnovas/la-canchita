var Sails = require('sails'),
  sails;

before(function(done) {
  Sails.lift({
    log: {
      level: 'error'
    },
    models: {
      connection: 'test',
      migrate: 'drop'
    }
  }, function(err, server) {
    sails = server;
    done(err);
  });
});

after(function(done) {
  // here you can clear fixtures, etc.
  console.log();
  sails.lower(done);
});


