/**
 * isMeetingOpen
 *
 * @module      :: Policy
 * @description :: If the meeting allows new joins. i.e. is in the future
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

module.exports = function(req, res, next) {

  var meeting = req.requestedMeeting;
  var now = new Date();

  if (meeting.when < now){
    return res.forbidden('meeting_is_closed_due_to_date');
  }

  next();

};
