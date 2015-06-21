/**
 * canUpdate
 *
 * @module      :: Policy
 * @description :: If a user has a role member to udpate a Group
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function(req, res, next) {

  Membership
    .findOne({
      group: req.params.id,
      user: req.user.id
    })
    .exec(function(err, member){
      if (err) return next(err);
      if (!member) {
        return res.forbidden('You are not a member of this group.');
      }

      if (['owner' /*, 'admin' */].indexOf(member.role) === -1){
        return res.forbidden('You cannot update this group.');
      }

      next();
    });

};
