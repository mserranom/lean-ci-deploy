///<reference path="terminal.ts"/>
///<reference path="promises.ts"/>
var promises_1 = require('./promises');
var shell = require('shelljs');
var ssh;
(function (ssh) {
    function execute(host, commands) {
        var d = promises_1.P.defer();
        var finishString = 'FINISHED_1235918273651972365';
        var commandList = commands.join(';') + ';echo ' + finishString;
        var command = "ssh -q -oStrictHostKeyChecking=no " + host + " '" + commandList + "'";
        console.info(command);
        var proc = shell.exec(command, { silent: true, async: true });
        proc.stdout.on('data', function (data) {
            if (data.indexOf(finishString) != -1) {
                var msg = 'ssh execution complete';
                console.log(msg);
                d.resolve(msg);
            }
            else {
                console.info('ssh.stdout -- ' + data);
            }
        });
        proc.stderr.on('data', function (data) {
            console.warn('ssh.stderr -- ' + data);
        });
        return d.promise();
    }
    ssh.execute = execute;
})(ssh = exports.ssh || (exports.ssh = {}));
