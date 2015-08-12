/**
 * canLeave
 *
 * @module      :: Policy
 * @description :: If an assistant can leave a meeting, i.e. after confirm
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

var moment = require('moment');

module.exports = function(req, res, next) {

  var meeting = req.requestedMeeting;

  var found = meeting.attendees.filter(function(attendee){
    return (attendee.user === req.groupMember.user.id);
  });

  if (found.length === 0){
    return res.conflict('user_is_not_attending');
  }

  if (found[0].isConfirmed){
    return res.conflict('cannot_remove_confirmed_users');
  }

  next();

};
