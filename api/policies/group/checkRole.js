/**
 * checkRole
 *
 * @module      :: Policy
 * @description :: If Requesting Member has an allowed Role to do an action
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

var allowed = {

  findOne : [ 'owner', 'admin', 'moderator', 'member' ],
  update  : [ 'owner', 'admin' ],
  uploadpicture  : [ 'owner', 'admin' ],
  destroy : [ 'owner' ],

  getmembers   : [ 'owner', 'admin', 'moderator', 'member' ],
  createmember   : [ 'owner', 'admin', 'moderator' ],
  removemember  : [ 'owner', 'admin' ],
  changemember : [ 'owner', 'admin' ],

  getmeetings: [ 'owner', 'admin', 'moderator', 'member' ],
  createmeeting : [ 'owner', 'admin' ],
  removemeeting : [ 'owner', 'admin' ],
  changemeeting : [ 'owner', 'admin' ],

};

module.exports = function(req, res, next) {

  var action = req.options.action;
  var member = req.groupMember;

  var roles = allowed[action];

  if (roles.indexOf(member.role) === -1){
    return res.forbidden('cannot_perform_this_action');
  }

  next();

};
