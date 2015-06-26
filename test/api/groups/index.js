
describe('\nGroup ( ͡°( ͡° ͜ʖ( ͡° ͜ʖ ͡°)ʖ ͡°) ͡°)\n', function() {

  // Group ----------------------------

  require('./findAll');
  require('./findOne');
  require('./create');
  require('./update');
  require('./destroy');

  require('./members');

  require('./meetings');

  // TODO:
  /*
   * Check if the group is removing the member after a "remove" (physical)
   * Add InvitedBy and RemovedBy > also check how it works for re-invite and physical removal
   * Create quota
   * DisplayName ? > adding updateMe
   *
   */

});