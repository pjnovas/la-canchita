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

    when: {
      type: 'date',
      defaultsTo: function(){
        var now = new Date();
        var aWeek = 7 * 24 * 60 * 60 * 1000;
        return new Date(now.getTime() + aWeek);
      }
    },

    replacements: { type: 'boolean' },

    confirmation: { type: 'boolean' },
    confirmStart: { type: 'date' },
    confirmEnd: { type: 'date' },

    min: { type: 'integer', defaultsTo: 0 }, // 0 - no limit
    max: { type: 'integer', defaultsTo: 0 }, // 0 - no limit

    assistants : { collection: 'Membership' },
    confirmed : { collection: 'Membership' },

    //alerts: { type: 'array' }, // hooks, emails, etc > New Model for this

  },

};

