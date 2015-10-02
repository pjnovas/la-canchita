
var path = require('path');
var async = require('async');
var _ = require('lodash');

var email = {};
var toMultiples = "no-reply@la-canchita.com";
var signature = "La Canchita";

function getUserEmails(setting, list, _user, done){

  var uids = [];
  list.forEach(function(item){
    // filter only users with email verified and skip creator
    if (item.user.email && item.user.verified){

      if (!_user || _user.id !== item.user.id){
        uids.push(item.user.id);
      }
    }
  });

  User // get user settings for each one
    .find({ id: uids })
    .populate('settings')
    .exec(function(err, users){
      if (err) return done(err);

      var emailsTo = [];
      users.forEach(function(user){
        // filter users that has active the notifications for this event
        if (user.settings.emails && user.settings[setting]){
          emailsTo.push(user.email);
        }
      });

      done(null, emailsTo);
    });
}

email.initialize = function(){

  sails.config.email.templateDir
    = path.resolve(sails.config.appPath, sails.config.email.templateDir);

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
          plink: sails.getBaseurl() + "/profile",
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

email.sendNewMeeting = function(noti, mid, _user){

  Meeting // Get the meeting
    .findOne({ id: mid })
    .populate('group')
    .exec(function(err, meeting){
      if (err) return console.dir(err);

      Membership // Get the active group members
        .find({ group: meeting.group.id, state: 'active' })
        .populate('user')
        .exec(function(err, members){
          if (err) return console.dir(err);

          getUserEmails(noti, members, _user, function(err, emailsTo){
            if (err) return console.dir(err);

            if (emailsTo.length > 0){

              sails.hooks.email.send("newmeeting", {
                link: sails.getBaseurl() + "/meetings/" + mid,
                plink: sails.getBaseurl() + "/profile",
                from: _user.name,
                meeting: meeting,
                signature: signature
              }, {
                to: toMultiples,
                bcc: emailsTo,
                subject: "Nuevo Partido" + (meeting.group.title ? " en " + meeting.group.title + "!" : "!")
              }, function(err) {
                if (err) return console.dir(err);
              });
            }

          });
        });
    });
};

email.sendCancelMeeting = function(noti, mid, _user){

  Attendee // Get attendees for this meeting
    .find({ meeting: mid })
    .populate('user')
    .exec(function(err, attendees){
      if (err) return console.dir(err);

      getUserEmails(noti, attendees, _user, function(err, emailsTo){
        if (err) return console.dir(err);

        if (emailsTo.length > 0){

          Meeting // Get the meeting
            .findOne({ id: mid })
            .populate('group')
            .exec(function(err, meeting){
              if (err) return console.dir(err);

              sails.hooks.email.send("cancelmeeting", {
                link: sails.getBaseurl() + "/meetings/" + mid,
                plink: sails.getBaseurl() + "/profile",
                from: _user.name,
                meeting: meeting,
                signature: signature
              }, {
                to: toMultiples,
                bcc: emailsTo,
                subject: "Partido Cancelado" + (meeting.group.title ? " en " + meeting.group.title + "!" : "!")
              }, function(err) {
                if (err) return console.dir(err);
              });
          });

        }

      });

    });
};

email.meetingsConfirmState = function(noti, mids){

  Meeting // Get the meeting
    .find({ id: mids })
    .exec(function(err, meetings){
      if (err) return console.dir(err);

      var senders = meetings.map(function(meeting){
        return function(_done){

          Membership // Get the active group members
            .find({ group: meeting.group, state: 'active' })
            .populate('user')
            .exec(function(err, members){
              if (err) return console.dir(err);

              getUserEmails(noti, members, null, function(err, emailsTo){
                if (err) return console.dir(err);

                if (emailsTo.length > 0){

                  sails.hooks.email.send("confirmmeeting", {
                    link: sails.getBaseurl() + "/meetings/" + meeting.id,
                    plink: sails.getBaseurl() + "/profile",
                    meeting: meeting,
                    signature: signature
                  }, {
                    to: toMultiples,
                    bcc: emailsTo,
                    subject: "Confirmación de asistencia al partido"
                  }, function(err) {
                    if (err) return console.dir(err);
                  });
                }

                meeting.confirmNotified = true;
                meeting.save(function(err){
                  if (err) {
                    console.log('ERROR on saving meeting for confirm notification ' + meeting.id);
                    console.dir(err);
                  }

                  _done();
                });

              });
            });

        };
      });

      async.parallel(senders, function(err){
        console.log('Sent confirmation state for meetings to ' + senders.length + ' meetings');
      });

    });
};

email.meetingsDayBefore = function(noti, mids){

  Meeting // Get the meeting
    .find({ id: mids })
    .exec(function(err, meetings){
      if (err) return console.dir(err);

      var senders = meetings.map(function(meeting){
        return function(_done){

          Attendee // Get attendees for this meeting
            .find({ meeting: meeting.id })
            .populate('user')
            .exec(function(err, attendees){
              if (err) return console.dir(err);

              getUserEmails(noti, attendees, null, function(err, emailsTo){
                if (err) return console.dir(err);

                if (emailsTo.length > 0){

                  sails.hooks.email.send("daybeforemeeting", {
                    link: sails.getBaseurl() + "/meetings/" + meeting.id,
                    plink: sails.getBaseurl() + "/profile",
                    meeting: meeting,
                    signature: signature
                  }, {
                    to: toMultiples,
                    bcc: emailsTo,
                    subject: "Recordatorio: mañana futbol!"
                  }, function(err) {
                    if (err) return console.dir(err);
                  });
                }

                meeting.tomorrowNotified = true;
                meeting.save(function(err){
                  if (err) {
                    console.log('ERROR on saving meeting for daybefore notification ' + meeting.id);
                    console.dir(err);
                  }

                  _done();
                });

              });
            });

        };
      });

      async.parallel(senders, function(err){
        console.log('Sent daybefore for meetings to ' + senders.length + ' meetings');
      });

    });
};

email.notify = function(event, data, user) {

  switch(event){
    case "new_meeting": //data > meeting
      email.sendNewMeeting("meetings_create", data.id, user);
      break;
    case "cancelled_meeting": //data.id > meetingId
      email.sendCancelMeeting("meetings_cancel", data.id, user);
      break;
  }

};

module.exports = email;
