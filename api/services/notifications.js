
var notifications = {};

notifications.initialize = function(){
  // TODO: Configs
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
