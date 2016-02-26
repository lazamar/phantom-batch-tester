console.log(__dirname);
console.log(process.cwd());

var system = require('system');

// if (system.args.length !== 2) {
//   console.log('Usage: run-jasmine.js URL');
//   return;
// }

var Promise = require('promise');
var childProcess = require('child_process');
var spawn = childProcess.spawn;

function testWithPhantom(fileName) {

  return new Promise(function (resolve, reject) {
    var args = ['runner.js', fileName];
    var cspr = spawn('phantomjs', args);
    var errors = 0;

    //cspr.stdout.setEncoding('utf8');
    cspr.stdout.on('data', function (data) {
      var buff = new Buffer(data);
      console.log(fileName + '\n' + buff.toString('utf8'));
    });

    cspr.stderr.on('data', function (data) {
      errors++;
      data += '';
      console.log(data.replace('\n', '\nstderr: '));
    });

    cspr.on('exit', function (code) {
      resolve(code + errors);
    });
  });
}

var runThroughFiles = (function () {
  var hadErrors = false;
  var i = 0;
  return function runThroughFiles(fileNames) {
    testWithPhantom(fileNames[i]).then(function (processExitVal) {
      hadErrors = (processExitVal !== 0) ? true : hadErrors;
      if (fileNames[i + 1]) {
        i++;
        runThroughFiles(fileNames);
      } else {
        var exitValue = hadErrors ? 1 : 0;
        console.log('Exit value: ' + exitValue);
        process.exit(exitValue);
      }
    });
  };
}());

var traverse = require('./traverse-fs');
traverse.folder()
.then(function (fileAddresses) {
  console.log('Files found:');
  fileAddresses = fileAddresses.reverse();
  console.log(fileAddresses);
  runThroughFiles(fileAddresses);
});
