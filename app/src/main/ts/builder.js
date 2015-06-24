///<reference path="terminal.ts"/>
///<reference path="config.ts"/>
///<reference path="model.ts"/>
///<reference path='../../../node_modules/immutable/dist/immutable.d.ts'/>
var config_1 = require('./config');
var Immutable = require('immutable');
var builder;
(function (builder) {
    var BuildService = (function () {
        function BuildService() {
        }
        BuildService.prototype.sendBuildRequest = function (agentURL, req) {
            console.log('sending build request to ' + agentURL + ", data: " + JSON.stringify(req));
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
            this._agents = Immutable.Map();
            this._data = data;
            this._queue = queue;
            this._buildService = service;
            this._terminalAPI = terminalAPI;
        }
        BuildScheduler.prototype.queueBuild = function (repo, commit) {
            var _this = this;
            if (!commit) {
                commit = '';
            }
            var project = this._data.getProject(repo);
            if (!project) {
                throw new Error('unknown project: ' + repo);
            }
            else {
                console.log('adding project to build queue: ' + project.repo);
                var pingURL = config_1.config.appUrl + '/build/pingFinish';
                var request = {
                    id: new Date().getTime() + "-" + Math.floor(Math.random() * 10000000000),
                    repo: repo,
                    commit: '',
                    pingURL: pingURL,
                };
                this._queue.add(request);
                if (project.downstreamDependencies.size > 0) {
                    project.downstreamDependencies.forEach(function (dep) { return _this.queueBuild(dep.downstream.repo); });
                }
                return request;
            }
        };
        BuildScheduler.prototype.startBuild = function () {
            var _this = this;
            var nextRequest = this._queue.next();
            if (!nextRequest) {
                return null;
            }
            console.log('starting build on repo: ' + nextRequest.repo);
            this._activeBuilds = this._activeBuilds.set(nextRequest.id, nextRequest);
            this._terminalAPI.createTerminalWithOpenPorts([config_1.config.defaultPort])
                .then(function (terminal) {
                console.log('key: ' + terminal.container_key);
                _this._agents = _this._agents.set(nextRequest.id, terminal);
                var agentURL = 'http://' + terminal.subdomain + "-" + config_1.config.defaultPort + '.terminal.com/start';
                _this._buildService.sendBuildRequest(agentURL, nextRequest);
            })
                .fail(function (error) { return _this._queue.finish(nextRequest); });
            return nextRequest;
        };
        BuildScheduler.prototype.pingFinish = function (result) {
            var buildId = result.request.id;
            var build = this._activeBuilds.get(result.request.id);
            if (!build) {
                throw new Error('unable to find active build with id=' + buildId);
            }
            var project = this._data.getProject(result.request.repo);
            this._data.updateDependencies(project.repo, result.buildConfig.dependencies);
            this._queue.finish(build);
            this._activeBuilds = this._activeBuilds.delete(buildId);
            this.terminateAgent(buildId);
        };
        BuildScheduler.prototype.terminateAgent = function (buildId) {
            this._terminalAPI.closeTerminal(this._agents.get(buildId));
            this._agents = this._agents.remove(buildId);
        };
        return BuildScheduler;
    })();
    builder.BuildScheduler = BuildScheduler;
})(builder = exports.builder || (exports.builder = {}));
