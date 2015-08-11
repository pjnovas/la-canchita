/**
* Meeting.js
*
* @description :: A meeting for a group of members which take place somewhere
*                  at sometime
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  schema: true,

  attributes: {

    group: { model: 'Group', required: true },
    createdBy: { model: 'Membership' },

    title: { type: 'string' },
    info: { type: 'string' },

    place: { type: 'string' },
    location: { type: 'array' }, // [ lat, lng ] | ie: [ -73.97, 40.77 ]

    when: {
      type: 'date',
      defaultsTo: function(){
        var now = new Date();
        var aWeek = 7 * 24 * 60 * 60 * 1000;
        return new Date(now.getTime() + aWeek);
      }
    },

    duration: { type: 'json'/*, defaultsTo: { times: 1, period: 'hours' } */},

    replacements: { type: 'boolean' },

    confirmation: { type: 'boolean' },
    confirmStart: { type: 'json'/*, defaultsTo: { times: 2, period: 'days' } */},
    confirmEnd: { type: 'json'/*, defaultsTo: { times: 2, period: 'hours' } */},

    min: { type: 'integer', defaultsTo: 0 }, // 0 - no limit
    max: { type: 'integer', defaultsTo: 0 }, // 0 - no limit

    assistants : { collection: 'Membership' },
    confirmed : { collection: 'Membership' },

    //alerts: { type: 'array' }, // hooks, emails, etc > New Model for this
  },

};

