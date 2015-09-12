/**
* UserSettings.js
*
* @description :: Setings for an user, like notifications toggles
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  schema: true,

  attributes: {

    user: { model: 'User', required: true },

    // Events

    invites: { type: 'boolean', defaultsTo: true },

    groups_change: { type: 'boolean', defaultsTo: true },
    groups_members: { type: 'boolean', defaultsTo: true },

    meetings_create: { type: 'boolean', defaultsTo: true },
    meetings_change: { type: 'boolean', defaultsTo: true },
    meetings_states: { type: 'boolean', defaultsTo: true },
    meetings_remove: { type: 'boolean', defaultsTo: true },

    // Hooks

    emails: { type: 'boolean', defaultsTo: true },

  }

};
