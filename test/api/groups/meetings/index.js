
describe('Meetings', function() {

  require('./findAll'); // retrieve meetings of a group
  require('./findOne'); // retrieve a meeting
  require('./create'); // create a Meeting
  require('./remove'); // remove a Meeting
  require('./change'); // update a Meeting

  require('./join'); // assist a meeting
  require('./leave'); // decline assistance of a meeting
  require('./confirm'); // confirm a meeting

});
