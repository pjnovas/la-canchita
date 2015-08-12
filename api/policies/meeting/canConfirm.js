/**
 * meetingCanConfirm
 *
 * @module      :: Policy
 * @description :: If the meeting has enabled confirmation and has room for it
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

var moment = require('moment');

module.exports = function(req, res, next) {

  var meeting = req.requestedMeeting;

  if (!meeting.confirmation){
    return res.forbidden('meeting_has_no_confirmation');
  }

  var now = moment();

  var cStart = null;
  var cEnd = null;
  var mStart = meeting.confirmStart;
  var mEnd = meeting.confirmEnd;

  if (mStart && mStart.times && mStart.period){
    cStart = moment(meeting.when).subtract(mStart.times, mStart.period);
  }

  if (mEnd && mEnd.times && mEnd.period){
    cEnd = moment(meeting.when).subtract(mEnd.times, mEnd.period);
  }

  if (cStart && cStart.isValid() && now < cStart){
    return res.forbidden('confirmation_is_not_open_yet');
  }

  if (cEnd && cEnd.isValid() && now > cEnd){
    return res.forbidden('confirmation_has_closed');
  }

  var found = meeting.attendees.filter(function(attendee){
    return (attendee.user === req.groupMember.user.id);
  });

  if (found.length === 0){
    return res.conflict('user_is_not_attending');
  }

  if (found[0].isConfirmed){
    return res.conflict('user_has_already_confirmed');
  }

  next();

};
