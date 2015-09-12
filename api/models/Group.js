/**
* Group.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  schema: true,

  attributes: {

    title : { type: 'string' },
    picture: { type: 'string' },
    description: { type: 'string' },

    members : { collection: 'Membership', via: 'group' },
    meetings : { collection: 'Meeting', via: 'group' },

    removed: { type: 'boolean', defaultsTo: false }

  }
};
