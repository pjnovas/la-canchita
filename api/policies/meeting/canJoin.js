/**
 * canJoin
 *
 * @module      :: Policy
 * @description :: If the meeting has room for another assistant to join
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

module.exports = function(req, res, next) {

  var meeting = req.requestedMeeting;

  var isAttendee = meeting.attendees.some(function(attendee){
    return (attendee.user === req.groupMember.user.id);
  });

  if (isAttendee){
    return res.conflict('user_already_joined');
  }

  if (meeting.max === 0){ // no limit
    return next();
  }

  if (!meeting.replacements && meeting.attendees.length >= meeting.max){
    return res.forbidden('meeting_has_no_more_room_for_attendees');
  }

  next();

};
