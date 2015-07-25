
var path = require('path');
var async = require('async');

var email = {};

email.initialize = function(){

  sails.config.email.templateDir
    = path.resolve(sails.config.appPath, sails.config.email.templateDir);

  //sails.config.email.testMode = (sails.environment === 'test') ? true : false;

};

email.sendInvites = function(invites, done){

  async.series(
    invites.map(function(invite){

      return function(_done){

        sails.hooks.email.send("invite", {
          link: sails.getBaseurl() + "/v/invite/" + invite.token,
          from: invite.invitedBy.name,
          group: invite.group.title,
          signature: "La Canchita"
        }, {
          to: invite.email,
          subject: "Te invitaron a un Grupo"
        }, function(err) {
          if (err) { return console.dir(err); }
          _done(err);
        });

      };
    }), function(err){
      done(err);
    });
};

module.exports = email;