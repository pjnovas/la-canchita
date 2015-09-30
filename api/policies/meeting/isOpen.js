/**
 * isMeetingOpen
 *
 * @module      :: Policy
 * @description :: If the meeting allows new joins. i.e. is in the future
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

var moment = require('moment');

module.exports = function(req, res, next) {

  var meeting = req.requestedMeeting;
  var now = moment();
  var when = meeting.when && moment(meeting.when);

  if (when && when.isValid() && when < now){
    return res.forbidden('meeting_is_closed_due_to_date');
  }

  if (meeting.cancelled){
    return res.forbidden('meeting_is_closed_due_to_cancellation');
  }

  next();

};
