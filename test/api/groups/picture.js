var fs = require('fs');
var path = require('path');
var builder = require('./builder');

describe('POST /groups/:id/picture', function() {

  var groups;

  before(function(done){

    var groups_data = [{
      title: 'Group Awesome 2',
      description: 'My cool group 2',
      members: [{
        user: userAgents[0].user.id,
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

  function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename)
    var fileSizeInBytes = stats["size"]
    return fileSizeInBytes
  }

  it('must upload a picture and set it to the group', function (done) {
    var gid = groups[0].id;

    userAgents[0]
      .post('/api/groups/' + gid + '/picture')
      .attach('image', __dirname + '/test.jpg')
      .expect(204)
      .end(function(err, res){

        var _path = path.resolve(sails.config.appPath, 'assets/images/groups');
        var uploaded = _path + '/' + gid + '.jpg';

        var expected = getFilesizeInBytes(__dirname + '/test.jpg');
        var actual = getFilesizeInBytes(uploaded);

        // compare uploaded image size
        expect(expected).to.be.equal(actual);

        // check the image is accesible
        userAgents[0]
          .get('/images/groups/' + gid + '.jpg')
          .expect(200)
          .end(function(err, res){
            // remove uploaded image
            fs.unlink(uploaded, done);
          });
      });

  });

});
