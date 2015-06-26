/**
* Meeting.js
*
* @description :: A meeting for a group of members which take place somewhere
*                  at sometime
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

    group: { model: 'Group', required: true },
    createdBy: { model: 'Membership' },

    title: { type: 'string' },
    info: { type: 'string' },
    place: { type: 'string' },
    when: { type: 'date' },

    replacements: { type: 'boolean' },

    confirmation: { type: 'boolean' },
    confirmStart: { type: 'date' },
    confirmEnd: { type: 'date' },

    minParticipants: { type: 'integer', defaultsTo: 0 }, // 0 - no limit
    maxParticipants: { type: 'integer', defaultsTo: 0 }, // 0 - no limit

    participants : { collection: 'Membership' },
    confirmed : { collection: 'Membership' },

    //alerts: { type: 'array' }, // hooks, emails, etc > New Model for this

  }

};

