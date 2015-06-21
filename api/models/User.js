/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  schema: true,

  attributes: {
    username  : { type: 'string', unique: true },
    email     : { type: 'email',  unique: true },

    name      : { type: 'string' },
    picture   : { type: 'string' },

    passports : { collection: 'Passport', via: 'user' }
  },

};

