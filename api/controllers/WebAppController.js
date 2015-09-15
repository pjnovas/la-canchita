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
        user: req.user,
				errors: req.flash('error')
      });

      return;
    }
/*
    if (req.session.redirect){
      console.log('index redirect > ' + req.session.redirect);
    }
*/
    res.view('index', {
      redirect: req.session.redirect,
			errors: req.flash('error')
    });
  }
};
