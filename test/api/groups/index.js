
describe('\nGroup ( ͡°( ͡° ͜ʖ( ͡° ͜ʖ ͡°)ʖ ͡°) ͡°)\n', function() {

  // Group ----------------------------

  require('./findAll');
  require('./findOne');
  require('./create');
  require('./update');
  require('./destroy');


  // Members --------------------------

  require('./add'); // invite a user
  require('./setRole'); // assign a role to a member
  require('./remove'); // kick a user from the group


  // Myself as Member -----------------

  require('./createMe'); // accept an invitation
  //require('./updateMe'); // update myself
  require('./removeMe'); // decline an invitation or leave group


  // TODO:
  /*
   * Check if the group is removing the member after a "remove" (physical)
   * Add InvitedBy and RemovedBy > also check how it works for re-invite and physical removal
   * Create quota
   * DisplayName ? > adding updateMe
   *
   */

});