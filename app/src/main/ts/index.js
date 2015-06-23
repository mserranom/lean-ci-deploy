///<reference path="util.ts"/>
///<reference path="config.ts"/>
///<reference path="github.ts"/>
///<reference path="builder.ts"/>
///<reference path="model.ts"/>
///<reference path="api.ts"/>
///<reference path="terminal.ts"/>
var util_1 = require('./util');
var config_1 = require('./config');
var github_1 = require('./github');
var builder_1 = require('./builder');
var model_1 = require('./model');
var api_1 = require('./api');
var terminal_1 = require('./terminal');
util_1.util.overrideConsoleColors();
// create data model
var projects = new model_1.model.AllProjects();
projects.populateTestData();
var queue = new model_1.model.BuildQueue();
// setup hooks for github
var githubAPI = new github_1.github.GithubAPI(config_1.config.github.username, config_1.config.github.password);
function registerWebhook(repo) {
    githubAPI.setupWebhook(config_1.config.github.hookUrl, repo)
        .then(function (id) { return console.log('hook ' + id + ' available!'); })
        .fail(function (error) { return console.warn('there was an issue: ' + error.message); });
}
console.error(projects.getProjects.length);
projects.getProjects().forEach(function (project) { return registerWebhook(project.repo); });
// setup server
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data
var server = app.listen(64321, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('http server listening at http://%s:%s', host, port);
});
// setup builder
var terminalApi = new terminal_1.terminal.TerminalAPI(config_1.config.terminal, config_1.config.sshPubKey);
var scheduler = new builder_1.builder.BuildScheduler(projects, queue, new builder_1.builder.BuildService(), terminalApi);
setInterval(function () { return scheduler.startBuild(); }, 1000);
// setup rest API
var restApi = new api_1.api.LeanCIApi(queue, scheduler);
restApi.start(app);
