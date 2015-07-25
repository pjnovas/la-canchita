/**
* Invites.js
*
* @description :: Invites to a group by email. Stores the necesary information
*   to send an email with the invitation and create the member on GET the email link
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  schema: true,

  attributes: {

    token: { type: 'string' }, // auto-generated code for verification
    email: { type: 'email' },

    group: { model: 'Group', required: true },

    invitedBy: { model: 'User' },

    expires: {
      type: 'date',
      defaultsTo: function(){
        var now = new Date();
        var aWeek = 7 * 24 * 60 * 60 * 1000;
        return new Date(now.getTime() + aWeek);
      }
    },

  }

};
