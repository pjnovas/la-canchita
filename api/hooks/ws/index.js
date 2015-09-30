
var _ = require('lodash');

/**
 * WebSockets Hook
 *
 * Integration with sails.sockets
 *
 * example of a hook at
 * https://github.com/balderdashy/sails-hook-email
 *
 * Docs of sails.sockets at
 * http://sailsjs.org/documentation/reference/web-sockets/sails-sockets
 *
 * @param  {App} sails
 * @return {Object}
 * @hook
 */

module.exports = function WS(sails) {

  var self;
  var suscribers = {};
  var rooms = ["groups", "meetings"];
  var events = { // events to broadcast > if is not here will ignore
    "groups": [
      "update",
      "remove",
      "new_members",
      "update_member",
      "new_meeting",
      "update_meeting",
      "remove_meeting",
      "cancelled_meeting"
    ],
    "meetings": [
      "update",
      "remove",
      "cancelled",
      "join",
      "leave",
      "confirm"
    ]
  };

  function isValidRequest(req, res){
    if (!req.isSocket){
      res.status(404);
      res.end();
      return false;
    }

    return true;
  }

  function isValidRoom(type, req, res){
    if (rooms.indexOf(type) === -1){
      res.status(404);
      res.end();
      return false;
    }

    return true;
  }

  function hasUserId(req, res){
    var uid = req.body.uid;
    if (!uid){
      res.status(400).send({ error: "expected user id" });
      return false;
    }

    return true;
  }

  function removeSocketSuscriber(socketId){
    for(var uid in suscribers){
      var idx = suscribers[uid].indexOf(socketId);

      if (idx > -1){
        suscribers[uid].splice(idx, 1);

        if (!suscribers[uid].length){
          delete suscribers[uid];
        }
        break;
      }
    }
  }

  return {

    /**
     * Default configuration
     * @type {Object}
     */
    defaults: {
      // TODO: default configs > can be used as 'sails.config.ws'
      // can also access to others like sails.config.appPath or sails.hooks.views
    },

    configure: function () {
      // Ensure we have the full path, relative to app directory
      // TODO: init configs
      // i.e.: sails.config[this.configKey].someConfi = "some value";
    },

    /**
     * @param  {Function} cb
     */
    initialize: function (cb) {
      self = this;

      sails.io.on('connection', function(socket) {
        // New Socket!
        socket.on('disconnect', function(){
          // Socket disconnected
          removeSocketSuscriber(sails.sockets.id(socket));
        });
      });

      // TODO: Async initialization
      return cb();
    },

    /**
     * Join a room.
     * @param  {Sting}    type. Entity type. i.e. groups
     * @param  {Sting}    id. Entity Id. i.e. GroupId
     * @param  {Object}   req. Express Request
     * @param  {Object}   res. Express Response
     */

    join: function (type, id, req, res) {
      if (!isValidRequest(req, res) || !isValidRoom(type, req, res)){
        return;
      }

      sails.sockets.join(req.socket, type + "/" + id);
      res.json({ joined: true });
    },

    /**
     * Leave a room.
     * @param  {Sting}    type. Entity type. i.e. groups
     * @param  {Sting}    id. Entity Id. i.e. GroupId
     * @param  {Object}   req. Express Request
     * @param  {Object}   res. Express Response
     */

    leave: function (type, id, req, res) {
      if (!isValidRequest(req, res) || !isValidRoom(type, req, res)){
        return;
      }

      sails.sockets.leave(req.socket, type + "/" + id);
      res.json({ left: true });
    },

    /**
     * Broadcast to a room.
     * @param  {Sting}    room. Name of the Room. i.e. groups/:groupId
     * @param  {Sting}    event. Name of the Event. i.e. groups:new_meeting
     * @param  {Object}   data. JSON to broadcast. i.e The Meeting created
     * @param  {Sting}    id. ID of the entity. i.e. GroupId
     * @param  {Object}   user. The user who did the action. i.e. commonly req.user
     */

    broadcast: function (type, id, event, data, user) {
      if (!events.hasOwnProperty(type) || events[type].indexOf(event) === -1){
        return;
      }

      var room = type + "/" + id;
      sails.sockets.broadcast(room, type + ":" + event, {
        user: user && _.pick(user, ['id', 'name', 'picture']),
        id: id,
        data: data
      });
    },

    suscribeNotis: function(req, res){
      if (!isValidRequest(req, res) || !hasUserId(req, res)){
        return;
      }

      var uid = req.body.uid;

      suscribers[uid] = suscribers[uid] || [];
      suscribers[uid].push(sails.sockets.id(req.socket));

      res.json({ joined: true });
    },

    unsuscribeNotis: function(req, res){
      if (!isValidRequest(req, res) || !hasUserId(req, res)){
        return;
      }

      var uid = req.body.uid;
      var socketId = sails.sockets.id(req.socket);

      var idx = suscribers[uid].indexOf(socketId);

      if (idx > -1){
        suscribers[uid].splice(idx, 1);

        if (!suscribers[uid].length){
          delete suscribers[uid];
        }
      }

      res.json({ left: true });
    },

    emitToUser: function (uid, event, data, user){
      if (suscribers.hasOwnProperty(uid)){
        sails.sockets.emit(suscribers[uid], event, {
          data: data,
          user: user && _.pick(user, ['id', 'name', 'picture'])
        });
      }
    }

  };
};
