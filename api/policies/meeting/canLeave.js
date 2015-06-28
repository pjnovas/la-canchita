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
    return res.conflict('cannot_remove_confirmed_members');
  }

  next();

};
