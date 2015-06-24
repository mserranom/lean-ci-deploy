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
        appUrl: 'http://mserranom145-64321.terminal.com',
        defaultPort: 64321,
        terminal: {
            userToken: '3bc0a70e212bf357d27ba0415ea36a4c024d74ce58c4f8ae770775d35fa0e4c9',
            accessToken: 'XyCgvXqDtb3wwL7BeAs5p2bysd3BMezT',
            buildAgentId: '5d9bdc3e30e0819a2dbe7c74fa3a5a0ae3d76699bc2f28c0cf99b0e128ab4966'
        },
        github: {
            username: 'mserranom',
            password: 'PtKBdG83',
            hookUrl: 'http://mserranom145-64321.terminal.com/github/push',
        }
    };
}
