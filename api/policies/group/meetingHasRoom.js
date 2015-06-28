/**
 * meetingHasRoom
 *
 * @module      :: Policy
 * @description :: If the meeting has room for another assistant
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

module.exports = function(req, res, next) {

  var meeting = req.requestedMeeting;

  if (meeting.max === 0){ // no limit
    return next();
  }

  if (!meeting.replacements && meeting.assistants.length >= meeting.max){
    return res.forbidden('meeting_has_no_more_room_for_assitants');
  }

  next();

};
