/**
 * canChangeMember.js
 *
 * @module      :: Policy
 * @description :: If a member has access rights to change the requested member
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

var roles = [ 'member', 'moderator', 'admin', 'owner' ]; // ASC Order

module.exports = function(req, res, next) {

  var action = req.options.action;
  var memberReq = req.requestedMember;

  var userRole = roles.indexOf(req.groupMember.role);
  var actualRole = roles.indexOf(memberReq.role);

  if (action === 'changemember'){

    var requestedRole = roles.indexOf(req.body.role);

    if (requestedRole < actualRole && userRole == actualRole){
      return res.forbidden('cannot_downgrade_same_role');
    }

    if (userRole < actualRole || userRole < requestedRole){
      return res.forbidden('cannot_assign_higher_role');
    }

    return next();
  }

  if (action === 'removemember'){

    if (!memberReq || memberReq.state === 'removed') {
      return res.notFound('Group not found');
    }

    if (userRole <= actualRole){
      return res.forbidden('cannot_remove_higher_or_same_role');
    }

    return next();
  }

  next();

};
