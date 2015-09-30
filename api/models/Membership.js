/**
* Membership.js
*
* @description :: The relation (state and role) of a User inside a Group
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  schema: true,

  attributes: {

    user: { model: 'User', required: true },
    group: { model: 'Group', required: true },

    role: {
      type: 'string',
      enum: ['owner', 'admin', 'moderator', 'member'],
      defaultsTo: 'member'
    },

    state: {
      type: 'string',
      enum: ['pending', 'active', 'rejected', 'removed', 'left'],
      defaultsTo: 'pending'
    },

    invitedBy: { model: 'Membership' },
    removedBy: { model: 'Membership' }
    
  }

};

////////////////////////////////////////////////////////////////////////

/* Roles

A role can downgrade itself,
If it is an Owner must exist another Owner to do so.

Owner:
- the creator of the group is an owner role by default, but is meant to allow
delegation to another member later, so the creator is treated as another member.
- Can change roles assign and downgrade EVERY role (not downgrade Owners)
- Cannot downgrade an Owner Role
- Can destroy a Group > ONLY if there are no matches played
- Can any member
- Can do everything else

Admin:
- Can create matches and manage them
- Can change roles assign and revoke moderators
- Can remove moderators and members
- Can edit a group info (like title, desc, admin, schedules)

Moderator:
- Can invite other users

Members:
- Basic role with no special permissions

*/

////////////////////////////////////////////////////////////////////////

/* States

PENDING:
- The membership has just been created, a user has been invited to a group.

ACTIVE:
- An active member in a group, this state is set when a User accepts an invitation.
- Default state for a creator of the group.
- ONLY a member with this state is able to access a group.

REMOVED:
- A member which has been removed from a group, this state is set when it has
a history on the group, i.e. has played matches.

REJECTED:
- A member which has been invited and opted to decline the invitation. It's used
to notify the inviter that user has declined, from here the inviter can opt to
remove this membership.

LEFT:
- A member which has left a group, this state is set when it has
a history on the group, i.e. has played matches.

*/
