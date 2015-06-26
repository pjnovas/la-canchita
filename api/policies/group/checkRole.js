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
  add     : [ 'owner', 'admin', 'moderator' ],
  setrole : [ 'owner', 'admin' ],
  update  : [ 'owner', 'admin' ],
  remove  : [ 'owner', 'admin' ],
  destroy : [ 'owner' ],
};

module.exports = function(req, res, next) {

  var action = req.options.action;
  var member = req.groupMember;

  if (allowed[action].indexOf(member.role) === -1){
    return res.forbidden('cannot_perform_this_action');
  }

  next();

};
