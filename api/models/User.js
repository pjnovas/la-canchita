/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var _ = require('lodash');

var priority = {
  type: 'string',
  enum: ['goalkeeper', 'defender', 'midfielder', 'forward', 'any'],
  defaultsTo: 'any'
};

module.exports = {

  schema: true,

  attributes: {
    username  : { type: 'string', unique: true },
    email     : { type: 'email',  unique: true },

    name      : { type: 'string' },
    picture   : { type: 'string' },

    passports : { collection: 'Passport', via: 'user' },
    settings: { model: 'UserSettings', via: 'user' },

    plan: { type: 'integer', defaultsTo: 0 },

    // Football specifics

    priority: _.cloneDeep(priority),
    priority2: _.cloneDeep(priority),
    priority3: _.cloneDeep(priority),

    leg: {
      type: 'string',
      enum: ['left', 'right', 'both'],
      defaultsTo: 'both'
    }

  },

};
