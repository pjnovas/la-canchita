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
    '*': isAuth,

    'findOne': isAuth.concat([ 'group/isMember', 'group/canDoAction' ]),

    'create': isAuth.concat([ 'group/canDoAction' ]),
    'update': isAuth.concat([ 'group/canDoAction' ]),

    'add': isAuth.concat([ 'group/canDoAction' ]),
    'setRole': isAuth.concat([ 'group/canDoAction' ]),
    'remove': isAuth.concat([ 'group/canDoAction' ]),

    'createMe': isAuth.concat([ 'group/isMember' ]),
    'removeMe': isAuth.concat([ 'group/isMember' ]),

  },

};
