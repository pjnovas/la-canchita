/**
 * canDoAction
 *
 * @module      :: Policy
 * @description :: If a user requesting is a Member of this Group
 *   and have the right role for the action
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

var roles = [ 'member', 'moderator', 'admin', 'owner' ];

var allowed = {
  findOne : [ 'owner', 'admin', 'moderator', 'member' ],
  add     : [ 'owner', 'admin', 'moderator' ],
  setrole : [ 'owner', 'admin' ],
  update  : [ 'owner', 'admin' ],
  remove  : [ 'owner', 'admin' ],
  destroy : [ 'owner' ],
};

module.exports = function(req, res, next) {

  var groupId = req.params.id;
  var action = req.options.action;

  if (req.options.alias === 'members' || action === 'setrole'){
    groupId = req.params.parentid;
  }

  if (action === 'create'){
    //TODO: add quota per user for create Groups
    return next();
  }

  Membership
    .findOne({
      group: groupId,
      user: req.user.id
    })
    .exec(function(err, member){
      if (err) return next(err);

      if (!member || member.state !== 'active') {
        return res.notFound('Group not found');
      }

      if (allowed[action].indexOf(member.role) === -1){
        return res.forbidden('cannot_perform_this_action');
      }

      if (action === 'setrole'){

        Membership
          .findOne({ id: req.params.id })
          .exec(function(err, memberReq){
            if (err) return next(err);

            var userRole = roles.indexOf(member.role);
            var actualRole = roles.indexOf(memberReq.role);
            var requestedRole = roles.indexOf(req.body.role);

            if (requestedRole < actualRole && userRole == actualRole){
              return res.forbidden('cannot_downgrade_same_role');
            }

            if (userRole < actualRole || userRole < requestedRole){
              return res.forbidden('cannot_assign_higher_role');
            }

            next();
          });

        return;
      }

      if (action === 'remove'){

        Membership
          .findOne({ id: req.params.id })
          .exec(function(err, memberReq){
            if (err) return next(err);

            if (!memberReq || memberReq.state === 'removed') {
              return res.notFound('Group not found');
            }

            var userRole = roles.indexOf(member.role);
            var actualRole = roles.indexOf(memberReq.role);

            if (userRole <= actualRole){
              return res.forbidden('cannot_remove_higher_or_same_role');
            }

            next();
          });

        return;
      }

      next();
    });

};
