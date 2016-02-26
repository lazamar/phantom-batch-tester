// =====================================================
// Traverses a file tree and returns an array of files
// that match a specific filter
// =====================================================
module.exports = (function () {
  var fs = require('fs');
  var path = require('path');
  var Promise = require('promise');

  var walk = function (dir, done) {
    var results = [];
    fs.readdir(dir, function (err, list) {
      if (err) return done(err);
      var pending = list.length;
      if (!pending) return done(null, results);
      list.forEach(function (file) {
        file = path.resolve(dir, file);
        fs.stat(file, function (err, stat) {
          if (stat && stat.isDirectory()) {
            walk(file, function (err, res) {
              results = results.concat(res);
              if (!--pending) done(null, results);
            });
          } else {
            results.push(file);
            if (!--pending) done(null, results);
          }
        });
      });
    });
  };

  function traverseFolder(filter, folderAddress) {
    files = [];
    filter = filter || /\.html$/;
    folderAddress = folderAddress || process.cwd();

    return new Promise(function (resolve, reject) {
      walk(folderAddress, function (err, results) {
        if (err) reject(err);
        for (var i = 0; i < results.length; i++) {
          if (results[i].match(filter)) {
            files.push(results[i]);
          }
        }

        resolve(files);
      });
    });

  }

  return {
    folder: traverseFolder,
  };
}());
