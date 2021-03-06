
function createOne(group_data, ready){

  async.waterfall([

    //create group
    function(done){
      Group.create(group_data, done);
    },

    // populate members
    function(group, done){
      Group.findOne({ id: group.id }).populateAll().exec(done);
    },

  ], ready);
}

function createAll(groups, ready){

  async.series(

    groups.map(function(group_data){

      return function(done){
        createOne(group_data, done);
      };

    })

  , ready);
}

module.exports = {

  create: function(data, done){

    if (Array.isArray(data)){
      return createAll(data, done);
    }

    createOne(data, done);
  },

  clean: function(done){

    var models = [
      Invite,
      Meeting,
      Membership,
      Group
    ];

    async.series(
      models.map(function(model){
        return function(_done){
          model.destroy({}).exec(_done);
        };
      })
    , done);

  }

};