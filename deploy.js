var shell = require('shelljs');

function exec(cmd) {
    console.log(cmd);
    var res = shell.exec(cmd);
    if(res.code != 0) {
        shell.exit(res.code);
    }
    return res.output;
}

// clean temp files
exec('rm -rf app.zip app.tar.gz app');

// setting configuration as heroku environment variable
var encodedConf = exec('cat config.json | base64');
exec('heroku config:set LEANCI_CONFIG=' + encodedConf.trim() + ' --app leanci');

// creating app tarball
shell.cp('../lean-ci/dist.zip', './app.zip');
exec('unzip -qq app.zip -d app');
exec('tar -pczf app.tar.gz app package.json');

// request app upload endpoints to heroku
var data = exec("curl -s -n -X POST https://api.heroku.com/apps/leanci/sources" +
    " -H 'Accept: application/vnd.heroku+json; version=3'");
var endpoints = JSON.parse(data);
var uploadUrl = endpoints['source_blob']['put_url'];
var getUrl = endpoints['source_blob']['get_url'];
var uploadCmd = "curl '" + uploadUrl + "' -X PUT -H 'Content-Type:' --data-binary @app.tar.gz";
var result = exec(uploadCmd);
console.log('upload finished!');

// request heroku deploy
var deployCmd = "curl -n -X POST https://api.heroku.com/apps/leanci/builds"
    + " -d '{\"source_blob\":{\"url\":\"" + getUrl + "\"}}' " +
    " -H 'Accept: application/vnd.heroku+json; version=3' -H \"Content-Type: application/json\"";

var deployStatus = exec(deployCmd);
console.log('\n\nApplication deployed:\n' + deployStatus);