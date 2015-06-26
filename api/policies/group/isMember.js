/**
 * isMember
 *
 * @module      :: Policy
 * @description :: If a user requesting is not a Member of this Group, return a 404
 *                  otherwise set req.groupMember for further validations.
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

module.exports = function(req, res, next) {
  var groupId = req.params.id;
  var action = req.options.action;

  if (req.options.alias === 'members' ||
    ['createme', 'removeme', 'setrole'].indexOf(action) > -1){

    groupId = req.params.parentid;
  }

  Membership
    .findOne({ group: groupId, user: req.user.id })
    .populateAll()
    .exec(function(err, member){
      if (err) return next(err);

      if (!member) {
        return res.notFound('Group not found');
      }

      req.groupMember = member;

      if (['createme', 'removeme'].indexOf(action) > -1 && member.state === 'pending'){
        // where a user is accepting or rejecting an invitation
        return next();
      }

      if (member.state !== 'active'){
        return res.notFound('Group not found');
      }

      next();
    });

};
