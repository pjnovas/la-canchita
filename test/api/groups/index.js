
describe('\nGroup ( ͡°( ͡° ͜ʖ( ͡° ͜ʖ ͡°)ʖ ͡°) ͡°)\n', function() {

  // Group ----------------------------
/*
  require('./findAll');

  require('./findOne');
  require('./create');
  require('./destroy');
  require('./update');
  require('./picture');
*/
  require('./members');

  //require('./meetings');

  // TODO:
  /*
   * Add resource to set Attended
   * Add Counters for join and confirm: attendance, joins, confirmations
   *
   * Should not do a physical remove of meetings closed (when) in the past
   * Check if the group is removing the member association after a "remove" (physical)
   * Add InvitedBy and RemovedBy > also check how it works for re-invite and physical removal
   * Create quota
   * DisplayName ? > adding updateMe
   *
   */

});