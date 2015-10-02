
var _ = require("lodash");
var notifications = {};

notifications.initialize = function(){
  // TODO: Configs
};

notifications.invites = function(group, members, user){
  var g = _.pick(group, ["id", "title", "picture", "description"]);

  members.forEach(function(member){
    var uid = member.user.id;
    var gm = _.clone(g);
    gm.member = member;
    sails.hooks.ws.emitToUser(uid, "new_invite", gm, user);
  });

  // TODO: Email, push notifications, sms, url requests, etc
};

notifications.group = function(id, event, data, user){
  sails.hooks.ws.broadcast("groups", id, event, data, user);
  sails.services.email.notify(event, data, user);
  // TODO: push notifications, sms, url requests, etc
};

notifications.meeting = function(id, event, data, user){
  sails.hooks.ws.broadcast("meetings", id, event, data, user);
  // TODO: push notifications, sms, url requests, etc
};

notifications.meetingsConfirmState = function(ids){
  sails.services.email.meetingsConfirmState("meetings_confirm_start", ids);
  // TODO: push notifications, sms, url requests, etc
};

notifications.meetingsDayBefore = function(ids){
  sails.services.email.meetingsDayBefore("meetings_daybefore_start", ids);
  // TODO: push notifications, sms, url requests, etc
};

module.exports = notifications;
