
describe('Members', function() {

  require('./add'); // invite a user
  require('./setRole'); // assign a role to a member
  require('./remove'); // kick a member

  // Myself as Member -----------------

  require('./createMe'); // accept an invitation
  //require('./updateMe'); // update myself
  require('./removeMe'); // decline an invitation or leave group

});