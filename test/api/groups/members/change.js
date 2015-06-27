
var builder = require('../builder');

describe('PUT /groups/:id/members/:id', function() {
  var groups;

  before(function(done){

    var groups_data = [{
      title: 'Group Awesome',
      description: 'My cool group',
      picture: 'http://pic.com/pic.png',
      members: [{
        user: userAgents[0].user.id, // requester to 1
        role: 'owner',
        state: 'active'
      },{
        user: userAgents[1].user.id, // updated by 0
        role: 'member',
        state: 'active'
      },{
        user: userAgents[2].user.id, // requester to 3
        role: 'admin',
        state: 'active'
      },{
        user: userAgents[3].user.id, // updated by 2
        role: 'member',
        state: 'active'
      },{
        user: userAgents[4].user.id, // moderator
        role: 'member',
        state: 'active'
      },{
        user: userAgents[5].user.id, // member
        role: 'moderator',
        state: 'active'
      }]
    }, {
      title: 'Group Awesome 2',
      description: 'My cool group 2',
      picture: 'http://pic.com/pic2.png',
      members: [{
        user: userAgents[7].user.id,
        role: 'owner',
        state: 'active'
      }]
    }];

    builder.create(groups_data, function(err, _groups){
      groups = _groups;
      done();
    });

  });

  after(builder.clean);

  function getMemberId(gid, uid, done){
    Membership.findOne({ group: gid, user: uid }).exec(done);
  }

  function sendSetRole(index, gid, uIndex, role, expected, done){
    var uid = userAgents[uIndex].user.id;

    getMemberId(gid, uid, function(err, member){
      if (err) return done(err);
      var mid = member.id;

      userAgents[index]
        .put('/api/groups/' + gid + '/members/' + mid)
        .send({ role: role })
        .expect(expected)
        .end(function(err, res){
          if (err) return done(err);

          if (expected !== 200){
            return done();
          }

          expect(res.body).to.be.an('object');
          expect(res.body.role).to.be.equal(role);
          done();
        });
    })
  }

  // Owner

  it('Owner CAN > member to moderator', function(done){
    sendSetRole(0, groups[0].id, 1, 'moderator', 200, done);
  });

  it('Owner CAN > moderator to admin', function(done){
    sendSetRole(0, groups[0].id, 1, 'admin', 200, done);
  });

  it('Owner CAN > admin to owner', function(done){
    sendSetRole(0, groups[0].id, 1, 'owner', 200, done);
  });

  it('Owner CANNOT > owner to admin', function(done){
    sendSetRole(0, groups[0].id, 1, 'admin', 403, done);
  });

  it('Owner CANNOT > owner to moderator', function(done){
    sendSetRole(0, groups[0].id, 1, 'moderator', 403, done);
  });

  it('Owner CANNOT > owner to member', function(done){
    sendSetRole(0, groups[0].id, 1, 'member', 403, done);
  });


  // Admin

  it('Admin CAN > member to moderator', function(done){
    sendSetRole(2, groups[0].id, 3, 'moderator', 200, done);
  });

  it('Admin CAN > moderator to admin', function(done){
    sendSetRole(2, groups[0].id, 3, 'admin', 200, done);
  });

  it('Admin CANNOT > admin to owner', function(done){
    sendSetRole(2, groups[0].id, 3, 'owner', 403, done);
  });

  it('Admin CANNOT > admin to moderator', function(done){
    sendSetRole(2, groups[0].id, 3, 'moderator', 403, done);
  });

  it('Admin CANNOT > admin to member', function(done){
    sendSetRole(2, groups[0].id, 3, 'member', 403, done);
  });

  it('Admin CANNOT > owner to admin', function(done){
    sendSetRole(2, groups[0].id, 0, 'admin', 403, done);
  });

  it('Admin CANNOT > owner to moderator', function(done){
    sendSetRole(2, groups[0].id, 0, 'moderator', 403, done);
  });

  it('Admin CANNOT > owner to member', function(done){
    sendSetRole(2, groups[0].id, 0, 'member', 403, done);
  });


  it('Admin CANNOT > moderator to owner', function(done){
    sendSetRole(2, groups[0].id, 4, 'owner', 403, done);
  });

  it('Admin CANNOT > member to owner', function(done){
    sendSetRole(2, groups[0].id, 5, 'owner', 403, done);
  });

  // Moderator and Member

  it('Moderator CANNOT change roles', function(done){
    sendSetRole(4, groups[0].id, 5, 'moderator', 403, done);
  });

  it('Member CANNOT change roles', function(done){
    sendSetRole(5, groups[0].id, 4, 'member', 403, done);
  });

  // External user

  it('Non Member CANNOT change roles - NotFound', function(done){
    sendSetRole(7, groups[0].id, 4, 'member', 404, done);
  });

});