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

  var isAssistant = meeting.assistants.some(function(member){
    return (member.id === req.groupMember.id);
  });

  if (isAssistant){
    return res.conflict('member_already_joined');
  }

  if (meeting.max === 0){ // no limit
    return next();
  }

  if (!meeting.replacements && meeting.assistants.length >= meeting.max){
    return res.forbidden('meeting_has_no_more_room_for_assitants');
  }

  next();

};
