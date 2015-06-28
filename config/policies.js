/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */

var setUser = ['passport'];
var isAuth = setUser.concat(['isAuthenticated']);

var group = {};
group.isMember = isAuth.concat([ 'group/isMember' ]);
group.checkRole = group.isMember.concat([ 'group/checkRole' ]);

group.canChangeMember = group.checkRole.concat([ 'group/setMemberById', 'group/canChangeMember' ]);
group.canRemoveMeeting = group.checkRole.concat([ 'meeting/setMeetingById', 'group/canRemoveMeeting' ]);

var meeting = {};
meeting.isMember = isAuth.concat([ 'meeting/setMeetingById' ]).concat(group.isMember);
meeting.isOpen = meeting.isMember.concat([ 'meeting/isOpen' ]);

meeting.join = meeting.isOpen.concat([ 'meeting/canJoin' ]);
meeting.leave = meeting.isOpen.concat([ 'meeting/canLeave' ]);
meeting.confirm = meeting.isOpen.concat([ 'meeting/canConfirm' ]);

module.exports.policies = {

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions (`true` allows public     *
  * access)                                                                  *
  *                                                                          *
  ***************************************************************************/

  '*': setUser,

  'WebAppController': {
    '*': setUser,
  },

  'AuthController': {
    '*': false,

    'login': setUser,
    'logout': setUser,
    'register': setUser,
    'callback': setUser,
    'provider': setUser,
  },

  'UserController': {
    '*': false,
    'me': isAuth,

    'find': isAuth, //TODO: REMOVE THIS POLICY
  },

  'GroupController': {
    '*': false,

    'find': isAuth,
    'create': isAuth,

    'findOne': group.checkRole,
    'update': group.checkRole,
    'destroy': group.checkRole,

    // Members

    'createMember': group.checkRole,
    'changeMember': group.canChangeMember,
    'removeMember': group.canChangeMember,

    'createMe': group.isMember,
    'removeMe': group.isMember,

    // Meetings

    'createMeeting': group.checkRole,
    'changeMeeting': group.checkRole,
    'removeMeeting': group.canRemoveMeeting,

    'joinMeeting': meeting.join,
    'leaveMeeting': meeting.leave,
    'confirmMeeting': meeting.confirm,

  },

};
