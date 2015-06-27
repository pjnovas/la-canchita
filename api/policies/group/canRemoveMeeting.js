/**
 * canRemoveMeeting.js
 *
 * @module      :: Policy
 * @description :: If a meeting has access rights to remove req.requestedMeeting
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

module.exports = function(req, res, next) {

  var meeting = req.requestedMeeting
  var userRole = req.groupMember.role;

  if (userRole === 'admin' && meeting.createdBy.id !== req.groupMember.id) {
    return res.forbidden('cannot_remove_non_own_meetings');
  }

  next();

};
