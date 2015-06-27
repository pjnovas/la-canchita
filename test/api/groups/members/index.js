
describe('Members', function() {

  require('./create'); // create a member (invite a user)
  require('./change'); // assign a role to a member
  require('./remove'); // kick a member

  // Logged in user as Member -----------------

  require('./createMe'); // accept an invitation
  require('./removeMe'); // decline an invitation or leave group

});