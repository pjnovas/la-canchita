var
  path = require('path'),
  async = require('async'),
  fs = require('fs'),
  moment = require('moment'),
  mime = require('mime');

var image = {};

var dirs;

image.initialize = function(){

  dirs = {
    group: path.resolve(sails.config.appPath, 'assets/images/groups'),
    profile: path.resolve(sails.config.appPath, 'assets/images/profiles')
  };

};

image.remove = function(type, filename, done){

  fs.unlink(dirs[type] + '/' + filename, function(err){
    if (err) {
      console.log('ERROR ON Removing Picture > ');
      console.dir(err);
    }

    done(err);
  });

};

image.upload = function(req, type, id, done){

  var images = [];

  var streamOpts = {
    dirname: dirs[type],
    maxBytes: 300000, // ~300KB
    saveAs: function(file) {
      var ct = file && file.headers && file.headers['content-type'] || '';
      var ext = ct && '.' + mime.extension(ct) || path.extname(file.filename);

      return id + '_' + moment().unix() + ext;
    },
    completed: function(fileData, next) {
      images.push(fileData);
      next();
    }
  };

  req.file('image').upload(sails.services.uploader(streamOpts), function (err, files) {
    if (err) return done(err);
    done(null, images[0].localName);
  });

};

/*
image.upload = function(req, type, id, done){

  var filer = req.file('image').upload({
    saveAs: picname,
    maxBytes: 300000, // ~300KB
    dirname: dirs[type],
  }, function (err, uploadedFiles) {
    if (err) return done(err);

    if (uploadedFiles.length === 0){
      return done('no-file');
    }

    if (uploadedFiles.length > 1){
      return done('only-one-allowed');
    }

    //console.dir(uploadedFiles);
    //done(null, picname);

    // check this ugly shit > give it a 3 sec to finish.
    setTimeout(function(){
      done(null, picname);
    }, (process.env.NODE_ENV === 'test') ? 1 : 3000);

  });

};
*/

module.exports = image;