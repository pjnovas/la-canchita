/**
 * canUpdate
 *
 * @module      :: Policy
 * @description :: If a user requesting is a Member of this Group
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

var allowed = {
  findOne: [ 'owner', 'admin', 'moderator', 'member' ],
  update: [ 'owner', 'admin' ],
  add   : [ 'owner', 'admin', 'moderator' ]
};

module.exports = function(req, res, next) {

  var groupId = req.params.id;
  if (req.options.alias === 'members'){
    groupId = req.params.parentid;
  }

  var action = req.options.action;

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

      if (!member || member.status !== 'active') {
        return res.notFound('Group not found');
      }

      if (allowed[action].indexOf(member.role) === -1){
        return res.forbidden('You cannot perform that action in this Group.');
      }

      next();
    });

};
