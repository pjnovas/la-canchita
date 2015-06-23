/**
 * canUpdate
 *
 * @module      :: Policy
 * @description :: If a user requesting is not a Member of this Group, return a 404
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

module.exports = function(req, res, next) {
  var groupId = req.params.id;

  if (req.options.alias === 'members'){
    groupId = req.params.parentid;
  }

  if (['createme', 'removeme'].indexOf(req.options.action) > -1){
    groupId = req.params.parentid;
  }

  Membership
    .findOne({
      group: groupId,
      user: req.user.id
    })
    .exec(function(err, member){
      if (err) return next(err);

      if (!member) {
        return res.notFound('Group not found');
      }

      next();
    });

};
