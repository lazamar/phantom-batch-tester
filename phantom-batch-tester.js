var system = require('system');
var Formatter = require('./formatter');
var Promise = require('promise');
var childProcess = require('child_process');
var spawn = childProcess.spawn;
var formatter = new Formatter();

function testWithPhantom(fileName) {

  return new Promise(function (resolve, reject) {
    var runner = __dirname + '/runner.js';
    var args = [runner, fileName];
    var cspr = spawn('phantomjs', args);
    var errors = 0;
    var timeoutTime = 5000;
    var timeout = setTimeout(function () {
      cspr.kill('SIGINT');
      var timeoutMessage = formatter.colorize('red', 'Test timed out: ' + fileName);
      var abortingMessage = formatter.colorize('yellow', 'Aborting tests...');
      console.error(timeoutMessage);
      console.error(abortingMessage);
      process.exit(1);
      resolve(1);
    }, timeoutTime);

    //cspr.stdout.setEncoding('utf8');
    cspr.stdout.on('data', function (data) {
      var buff = new Buffer(data);
      console.log(fileName + '\n' + buff.toString('utf8'));
    });

    cspr.stderr.on('data', function (data) {
      errors++;
      data += '';
      var errMessage = formatter.colorize('red', data.replace('\n', '\nstderr: '));
      console.error(errMessage);
    });

    cspr.on('exit', function (code) {
      clearTimeout(timeout);
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
