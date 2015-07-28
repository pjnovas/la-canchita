/**
 * setMemberById
 *
 * @module      :: Policy
 * @description :: Set Member by id to req.requestedMember
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

module.exports = function(req, res, next) {

  Membership
    .findOne({ id: req.params.memberId })
    .populateAll()
    .exec(function(err, member){
      if (err) return next(err);

      if (!member){
        return res.notFound('Requested member not found');
      }

      req.requestedMember = member;
      next();
    });

};
