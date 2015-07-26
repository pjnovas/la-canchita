// Uploader utilities and helper methods
// designed to be relatively generic.

var fs = require('fs'),
  _ = require('lodash'),
  path = require('path'),
  Writable = require('stream').Writable;

module.exports = function(options) {

  var defaults = {
    dirname: path.resolve(sails.config.appPath, '.tmp'),
    saveAs: function(file){
      return file.filename;
    },
    completed: function(file, done){
      done();
    }
  };

  var opts = _.assign(defaults, options);

  var reciever = Writable({ objectMode: true });

  // This `_write` method is invoked each time a new file is received
  // from the Readable stream (Upstream) which is pumping filestreams
  // into this receiver.  (filename === `file.filename`).
  reciever._write = function onFile(file, encoding, done) {

    var newFilename = opts.saveAs(file),
        fileSavePath = opts.dirname + '/' + newFilename,
        outputs = fs.createWriteStream(fileSavePath, encoding);

    file.pipe(outputs);

    // Garbage-collect the bytes that were already written for this file.
    // (called when a read or write error occurs)
    function gc(err) {
      sails.log.debug("Garbage collecting file '" + file.filename + "' located at '" + fileSavePath + "'");

      fs.unlink(fileSavePath, function (gcErr) {
        if (gcErr) return done([err].concat([gcErr]));
        return done(err);
      });
    };

    file.on('error', function (err) {
      sails.log.error('READ error on file ' + file.filename, '::', err);
    });

    outputs.on('error', function failedToWriteFile (err) {
      sails.log.error('failed to write file', file.filename, 'with encoding', encoding, ': done =', done);
      gc(err);
    });

    outputs.on('finish', function successfullyWroteFile () {
      opts.completed({
        name: file.filename,
        size: file.size,
        localName: newFilename,
        path: fileSavePath
      }, done);
    });
  };

  return reciever;
}