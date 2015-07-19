var fs = require('fs');
var path = require('path');
var builder = require('./builder');
var moment = require('moment');

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

    Group.findOneById(gid, function(err, g){
      var prevG = g;

      expect(prevG.picture).to.not.be.ok();

      userAgents[0]
        .post('/api/groups/' + gid + '/picture')
        .attach('image', __dirname + '/test.jpg')
        .expect(200)
        .end(function(err, res){

          expect(res.body.picture).to.be.ok();

          var _path = path.resolve(sails.config.appPath, 'assets/images/groups');

          Group.findOneById(gid, function(err, g){
            var newG = g;

            expect(newG.picture).to.be.ok();
            expect(newG.picture.indexOf(gid)).to.be.greaterThan(-1);
            expect(newG.picture.split('_').length).to.be.equal(2);

            var uploaded = _path + '/' + newG.picture;

            var expected = getFilesizeInBytes(__dirname + '/test.jpg');
            var actual = getFilesizeInBytes(uploaded);

            // compare uploaded image size
            expect(expected).to.be.equal(actual);

            // check the image is accesible
            userAgents[0]
              .get('/images/groups/' + newG.picture)
              .expect(200)
              .end(function(err, res){

                setTimeout(function(){
                // upload a second one to test removal of previous
                userAgents[0]
                  .post('/api/groups/' + gid + '/picture')
                  .attach('image', __dirname + '/test.jpg')
                  .expect(200)
                  .end(function(err, res){

                    var lastPic = res.body.picture;
                    expect(lastPic).to.be.ok();
                    expect(lastPic).to.not.be.equal(newG.picture);

                    userAgents[0]
                      .get('/images/groups/' + newG.picture)
                      .expect(404)
                      .end(function(err){

                        expect(function(){
                          fs.statSync(uploaded);
                        }).to.throwError();

                        // remove last uploaded image
                        fs.unlink(_path + '/' + lastPic, done);
                      });

                  });
                }, 1500); // it's using a unix time (so let pass at least 1 sec)

              });

            });

        });

    });
  });

});
