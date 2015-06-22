/**
* Membership.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  schema: true,

  attributes: {

    user: { model: 'User', required: true },
    group: { model: 'Group', required: true },

    role: {
      type: 'string',
      enum: ['owner', 'admin', 'member'],
      defaultsTo: 'member'
    },

    status: {
      type: 'string',
      enum: ['pending', 'active', 'rejected', 'removed'],
      defaultsTo: 'pending'
    },

    matches_played: {
      type: 'integer',
      defaultsTo: 0
    }
  }

};

