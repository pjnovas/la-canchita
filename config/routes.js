/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  'get /': 'WebAppController.index',

  // Authentication

  'get /login': 'AuthController.login',
  'get /logout': 'AuthController.logout',
  'get /register': 'AuthController.register',
  'get /recover': 'AuthController.recover',

  'get /notfound': 'WebAppController.index',

  'post /auth/local': 'AuthController.callback',
  'post /auth/local/:action': 'AuthController.callback',

  'get /auth/:provider': 'AuthController.provider',
  'get /auth/:provider/callback': 'AuthController.callback',
  'get /auth/:provider/:action': 'AuthController.callback',

  'get /v/invite/:token': 'VerifyController.verifyInvite',
  'get /v/email/:token': 'VerifyController.verifyEmail',
  'get /v/recover/:token': 'VerifyController.recoverPassword',

  'get /newpassword/:token': 'WebAppController.index',
  'post /v/newpassword/:token': 'VerifyController.newPassword',

  'get /v/notfound': 'WebAppController.index',
  'get /v/expired': 'WebAppController.index',

  // Users

  'get /profile': 'WebAppController.index',

  'get /api/users/search': 'UserController.search',
  'get /api/users/me': 'UserController.me',
  'put /api/users/me': 'UserController.updateMe',
  'put /api/users/me/password': 'UserController.changePassword',
  'put /api/users/me/sendverify': 'UserController.sendEmailVerification',

  //'post /api/users/me/picture': 'UserController.uploadPicture',

  // Group

  'get /groups': 'WebAppController.index',
  'get /groups/new': 'WebAppController.index',
  'get /groups/:gid': 'WebAppController.index',
  'get /groups/:gid/edit': 'WebAppController.index',
  'get /groups/:gid/members': 'WebAppController.index',
  'get /groups/:gid/meetings': 'WebAppController.index',
  'get /groups/:gid/settings': 'WebAppController.index',

  'post /api/groups/:gid/picture': 'GroupController.uploadPicture',

  // Group Members

  'get /api/groups/:gid/members': 'GroupController.getMembers',
  'post /api/groups/:gid/members/me': 'GroupController.createMe',
  'delete /api/groups/:gid/members/me': 'GroupController.removeMe',

  'post /api/groups/:gid/members': 'GroupController.createMember',
  'put /api/groups/:gid/members/:memberId': 'GroupController.changeMember',
  'delete /api/groups/:gid/members/:memberId': 'GroupController.removeMember',

  // Group Meetings

  'get /meetings/:mid': 'WebAppController.index',
  'get /meetings/:mid/edit': 'WebAppController.index',
  'get /meetings/:gid/new': 'WebAppController.index',
  'get /meetings/:gid/new/:mid': 'WebAppController.index',

  'get /api/groups/:gid/meetings': 'GroupController.getMeetings',
  'post /api/groups/:gid/meetings': 'GroupController.createMeeting',

  'put /api/meetings/:meetingId': 'GroupController.changeMeeting',
  'delete /api/meetings/:meetingId': 'GroupController.removeMeeting',

  'get /api/meetings/:meetingId': 'GroupController.getFullMeeting',

  'post /api/meetings/:meetingId/attendees/me': 'GroupController.joinMeeting',
  'delete /api/meetings/:meetingId/attendees/me': 'GroupController.leaveMeeting',
  'post /api/meetings/:meetingId/confirmed/me': 'GroupController.confirmMeeting',
  //'post /api/meetings/:meetingId/attendance': 'GroupController.attendanceMeeting',

  // WebSockets
  'post /ws/notifications': function(req, res) {
    sails.hooks.ws.suscribeNotis(req, res);
  },

  'del /ws/notifications': function(req, res) {
    sails.hooks.ws.unsuscribeNotis(req, res);
  },

  'post /ws/groups/:gid': function(req, res) {
    sails.hooks.ws.join("groups", req.param('gid'), req, res);
  },

  'del /ws/groups/:gid': function(req, res) {
    sails.hooks.ws.leave("groups", req.param('gid'), req, res);
  },

  'post /ws/meetings/:mid': function(req, res) {
    sails.hooks.ws.join("meetings", req.param('mid'), req, res);
  },

  'del /ws/meetings/:mid': function(req, res) {
    sails.hooks.ws.leave("meetings", req.param('mid'), req, res);
  }

  /***************************************************************************
  *                                                                          *
  * Custom routes here...                                                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the custom routes above, it   *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/

};
