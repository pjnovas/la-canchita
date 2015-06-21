/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  me: function(req, res, next){
    User
      .findOne({ id: req.user.id })
      .exec(function(err, user){
        if (err) return next(err);
        if (!user) return res.notFound();
        res.json(user);
      });
  }

};

