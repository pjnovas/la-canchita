
var path = require('path');
var async = require('async');

var email = {};
var signature = "La Canchita";

email.initialize = function(){

  sails.config.email.templateDir
    = path.resolve(sails.config.appPath, sails.config.email.templateDir);

  sails.config.email.testMode = (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') ? true : false;
};

email.sendWelcome = function(userToken, done){

  sails.hooks.email.send("welcome", {
    link: sails.getBaseurl() + "/v/email/" + userToken.token,
    user: userToken.user,
    signature: signature
  }, {
    to: userToken.email,
    subject: "Bienvenido a " + signature
  }, done);

};

email.sendRecover = function(userToken, done){

  sails.hooks.email.send("recover", {
    link: sails.getBaseurl() + "/v/recover/" + userToken.token,
    user: userToken.user,
    signature: signature
  }, {
    to: userToken.user.email,
    subject: "Recuperar contraseña"
  }, done);

};

email.sendEmailVerification = function(userToken, done){

  sails.hooks.email.send("verify", {
    link: sails.getBaseurl() + "/v/email/" + userToken.token,
    user: userToken.user,
    signature: signature
  }, {
    to: userToken.email,
    subject: "Verificación de email"
  }, done);

};

email.sendInvites = function(invites, done){

  async.series(
    invites.map(function(invite){

      return function(_done){

        sails.hooks.email.send("invite", {
          link: sails.getBaseurl() + "/v/invite/" + invite.token,
          from: invite.invitedBy.name,
          group: invite.group.title,
          signature: signature
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
