
describe('Meetings', function() {

  require('./findAll'); // retrieve meetings of a group

  require('./create'); // create a Meeting
  require('./change'); // update a Meeting
  require('./remove'); // remove a Meeting

  require('./join'); // assist a meeting
  require('./leave'); // decline assistance of a meeting
  require('./confirm'); // confirm a meeting

});
