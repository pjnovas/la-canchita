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
  },

  updateMe: function(req, res, next){

    User
      .findOne({ id: req.user.id })
      .exec(function(err, user){
        if (err) return next(err);
        if (!user) return res.notFound();

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        user.save(function(err, user){
          if (err) return next(err);
          res.json(user);
        });

      });
  },

  search: function(req, res, next){

    User
      .find()
      .where({ name: { contains: req.query.q } })
      .limit(10)
      .exec(function(err, users){
        if (err) return next(err);
        users = users || [];

        res.json(
          users.map(function(user){
            return _.pick(user, ['id', 'name', 'picture']);
          })
        );

      });
  }

};

