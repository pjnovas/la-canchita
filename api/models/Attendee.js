/**
* Attendee.js
*
* @description :: A member of a group which attends to a meeting.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  schema: true,

  attributes: {

    meeting: { model: 'Meeting'/*, required: true*/ }, //TODO: reactivate the required > fails on SailsJS
    //member: { model: 'Membership', required: true },
    user: { model: 'User', required: true },

    isConfirmed: { type: 'boolean' },
    confirmedAt: { type: 'date' },

    hasAttended: { type: 'boolean' },

  },

};
