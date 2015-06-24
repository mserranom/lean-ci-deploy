///<reference path="../../../lib/node-0.10.d.ts"/>
var fs = require("fs");
exports.config;
var path = process.env.HOME + '/lean-ci-config.json';
console.log('looking up config.json in ' + path);
if (fs.existsSync(path)) {
    console.log(path + ' found');
    exports.config = JSON.parse(fs.readFileSync(path, 'utf8'));
}
else {
    console.log(path + ' not found, applying default config');
    exports.config = {
        appUrl: '',
        defaultPort: 64321,
        terminal: {
            userToken: '',
            accessToken: '',
            buildAgentId: ''
        },
        github: {
            username: '',
            password: '',
            hookUrl: '',
        }
    };
}
