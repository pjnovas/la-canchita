/**
* UserToken.js
*
* @description :: User tokens, stores a pair of a user and token for email
*   verification and password resets
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  schema: true,

  attributes: {

    user: { model: 'User' },
    token: { type: 'string' }, // auto-generated code for verification
    type: { type: 'string', enum: ['email', 'password'] },

    expires: {
      type: 'date',
      defaultsTo: function(){
        var now = new Date();
        var oneDay = 24 * 60 * 60 * 1000;
        return new Date(now.getTime() + oneDay);
      }
    },

  }

};
