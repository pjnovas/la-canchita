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

var meeting = {};
meeting.isMember = isAuth.concat([ 'meeting/setMeetingById' ]).concat(group.isMember);
meeting.isOpen = meeting.isMember.concat([ 'meeting/isOpen' ]);

meeting.canUpdate = meeting.isOpen.concat([group.checkRole]);
meeting.canRemove = meeting.isOpen.concat([group.checkRole, 'group/canRemoveMeeting' ]);

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

  'VerifyController': {
    '*': setUser,
  },

  'AuthController': {
    '*': false,

    'login': setUser,
    'logout': setUser,
    'register': setUser,
    'recover': setUser,
    'callback': setUser,
    'provider': setUser,
  },

  'UserController': {
    '*': false,

    'me': isAuth,
    'updateMe': isAuth,
    'search': isAuth,
    'changePassword': isAuth,
    'sendEmailVerification': isAuth,

    'find': isAuth,
  },

  'GroupController': {
    '*': false,

    'find': isAuth,
    'create': isAuth,

    'findOne': group.checkRole,
    'update': group.checkRole,
    'destroy': group.checkRole,

    'uploadPicture': group.checkRole,

    // Members

    'getMembers': group.isMember,
    'createMember': group.checkRole,
    'changeMember': group.canChangeMember,
    'removeMember': group.canChangeMember,

    'createMe': group.isMember,
    'removeMe': group.isMember,

    // Meetings

    'getMeetings': group.isMember,
    'getFullMeeting': meeting.isMember,
    'createMeeting': group.checkRole,
    'changeMeeting': meeting.canUpdate,
    'removeMeeting': meeting.canRemove,

    'joinMeeting': meeting.join,
    'leaveMeeting': meeting.leave,
    'confirmMeeting': meeting.confirm,

  },

};
