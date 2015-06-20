/**
 * WebAppController
 *
 * @description :: Server-side logic for managing Webapps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	index: function(req, res){

    if (req.session.authenticated){

      res.view('index', {
        user: req.user
      });

      return;
    }

    res.view('index');
  }
};

