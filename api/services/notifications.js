
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
  // TODO: Email, push notifications, sms, url requests, etc
};

notifications.meeting = function(id, event, data, user){
  sails.hooks.ws.broadcast("meetings", id, event, data, user);
  // TODO: Email, push notifications, sms, url requests, etc
};

module.exports = notifications;
