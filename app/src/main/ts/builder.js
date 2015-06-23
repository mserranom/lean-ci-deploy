///<reference path="terminal.ts"/>
///<reference path="ssh.ts"/>
///<reference path="config.ts"/>
///<reference path="model.ts"/>
///<reference path='../../../node_modules/immutable/dist/immutable.d.ts'/>
var Immutable = require('immutable');
var builder;
(function (builder) {
    var BuildResult = (function () {
        function BuildResult() {
            this.log = '';
        }
        return BuildResult;
    })();
    builder.BuildResult = BuildResult;
    var BuildService = (function () {
        function BuildService() {
        }
        BuildService.prototype.sendBuildRequest = function (agentURL, req) {
            var request = require('request');
            var args = {
                headers: {
                    'content-type': 'application/json' },
                'url': agentURL,
                'body': JSON.stringify(req)
            };
            request.post(args, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log('build requested to ' + agentURL);
                }
                else if (error) {
                    console.error('unable to request build: ' + error);
                }
                else {
                    console.error('error requesting build with HTTP status: ' + response.statusCode);
                }
            });
        };
        return BuildService;
    })();
    builder.BuildService = BuildService;
    var BuildScheduler = (function () {
        function BuildScheduler(data, queue, service, terminalAPI) {
            this._activeBuilds = Immutable.Map();
            this._data = data;
            this._queue = queue;
            this._buildService = service;
            this._terminalAPI = terminalAPI;
        }
        BuildScheduler.prototype.queueBuild = function (repo) {
            var _this = this;
            var project = this._data.getProject(repo);
            if (!project) {
                console.error('unknown project: ' + repo);
            }
            else {
                console.log('adding project to build queue: ' + project.repo);
                this._queue.add(this._data.getProject(repo));
                if (project.downstreamDependencies.size > 0) {
                    project.downstreamDependencies.forEach(function (dep) { return _this.queueBuild(dep.downstream.repo); });
                }
            }
        };
        BuildScheduler.prototype.startBuild = function () {
            var _this = this;
            var repo = this._queue.next();
            if (!repo) {
                return null;
            }
            var pingURL = 'http://mserranom145-64321.terminal.com/build/pingFinish';
            console.log('starting build on repo: ' + repo.repo);
            var req = {
                id: new Date().getTime() + "-" + Math.floor(Math.random() * 10000000000),
                repo: repo.repo,
                commit: '',
                pingURL: pingURL,
            };
            this._activeBuilds = this._activeBuilds.set(req.id, req);
            this._terminalAPI.createTerminalWithOpenPorts([65234])
                .then(function (terminal) {
                console.log('key: ' + terminal.container_key);
                var agentURL = "http://" + terminal.subdomain + "-64321.terminal.com:";
                _this._buildService.sendBuildRequest(agentURL, req);
            })
                .fail(function (error) { return _this._queue.finish(repo); });
            return req;
        };
        BuildScheduler.prototype.pingFinish = function (buildId, result) {
            var build = this._activeBuilds.get(buildId);
            if (!build) {
                throw new Error('unable to find active build with id=' + buildId);
            }
            var project = this._data.getProject(result.repo);
            this._data.updateDependencies(project.repo, result.buildConfig.dependencies);
            this._activeBuilds = this._activeBuilds.delete(buildId);
            this._queue.finish(project);
        };
        return BuildScheduler;
    })();
    builder.BuildScheduler = BuildScheduler;
})(builder = exports.builder || (exports.builder = {}));
