/**
 * VerifyController
 *
 * @description :: Server-side logic for managing Verifies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  verifyInvite: function(req, res){
    req.session.redirect = '';

    if (req.session.authenticated){

      // make verification and go on.

      console.log('Verified Invite for ' + req.user.username);

      res.redirect('/');
      return;
    }

    req.session.redirect = req.path;
    res.redirect('/');
  },

  verifyEmail: function(req, res){
    req.session.redirect = '';

    if (req.session.authenticated){

      // make verification and go to profile with verification.

      console.log('Verified Email for ' + req.user.username);

      res.redirect('/');
      return;
    }

    req.session.redirect = req.path;
    res.redirect('/');
  }

};

