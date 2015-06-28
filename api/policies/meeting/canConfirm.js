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
  var cStart = moment(meeting.confirmationStart);
  var cEnd = moment(meeting.confirmationEnd);

  if (cStart.isValid() && now < cStart){
    return res.forbidden('confirmation_is_not_open_yet');
  }

  if (cEnd.isValid() && now > cEnd){
    return res.forbidden('confirmation_has_closed');
  }

  var isAssistant = meeting.assistants.some(function(member){
    return (member.id === req.groupMember.id);
  });

  if (!isAssistant){
    return res.conflict('member_is_not_assistant');
  }

  var hasConfirmed = meeting.confirmed.some(function(member){
    return (member.id === req.groupMember.id);
  });

  if (hasConfirmed){
    return res.conflict('member_has_already_confirmed');
  }

  next();

};
