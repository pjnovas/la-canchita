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
  destroy : [ 'owner' ],

  add     : {
    members   : [ 'owner', 'admin', 'moderator' ],
    meetings  : [ 'owner', 'admin' ],
  },
  setrole : [ 'owner', 'admin' ],
  remove  : [ 'owner', 'admin' ],
};

module.exports = function(req, res, next) {

  var action = req.options.action;
  var member = req.groupMember;
  var alias = req.options.alias;

  var roles = allowed[action];

  if (!Array.isArray(roles)){
    roles = allowed[action][alias];
  }

  if (roles.indexOf(member.role) === -1){
    return res.forbidden('cannot_perform_this_action');
  }

  next();

};
