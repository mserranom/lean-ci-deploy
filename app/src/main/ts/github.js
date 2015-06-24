///<reference path="promises.ts"/>
var promises_1 = require('./promises');
var github;
(function (github) {
    var GithubAPI = (function () {
        function GithubAPI(user, pass) {
            var GitHubApi = require("github");
            this._service = new GitHubApi({
                // required
                version: "3.0.0",
                // optional
                debug: false,
                protocol: "https",
                host: "api.github.com",
                timeout: 5000,
                headers: {
                    "user-agent": "lean-ci" // GitHub is happy with a unique user agent
                }
            });
            this._service.authenticate({
                type: "basic",
                username: user,
                password: pass
            });
        }
        GithubAPI.prototype.setupWebhook = function (url, repo) {
            var _this = this;
            var d = promises_1.P.defer();
            this.checkWebhookExists(url, repo)
                .then(function (hookId) { return d.resolve(hookId); })
                .fail(function () { return _this.createWebhook(url, repo)
                .then(function (hookId) { return d.resolve(hookId); })
                .fail(function (message) { return d.reject(message); }); });
            return d.promise();
        };
        GithubAPI.prototype.checkWebhookExists = function (url, repo) {
            var d = promises_1.P.defer();
            this._service.repos.getHooks({
                user: repo.split('/')[0],
                repo: repo.split('/')[1],
            }, function (err, res) {
                if (err) {
                    var errorMessage = "github 'getHooks' request error: " + err;
                    console.log(errorMessage);
                    d.reject({ message: errorMessage });
                }
                else {
                    console.info('github request result: ' + JSON.stringify(res));
                    var hookId;
                    for (var i = 0; i < res.length; i++) {
                        if (res[i].config.url === url) {
                            hookId = res[i].id;
                            break;
                        }
                    }
                    if (hookId != null) {
                        d.resolve(hookId);
                    }
                    else {
                        d.reject({ message: 'webhook for ' + url + ' not found' });
                    }
                }
            });
            return d.promise();
        };
        GithubAPI.prototype.createWebhook = function (url, repo) {
            var d = promises_1.P.defer();
            this._service.repos.createHook({
                name: 'web',
                events: ['push'],
                user: repo.split('/')[0],
                repo: repo.split('/')[1],
                active: true,
                config: {
                    url: url,
                    content_type: 'json'
                }
            }, function (err, res) {
                if (err) {
                    var errorMessage = "github 'createHook' request error: " + err;
                    console.log(errorMessage);
                    d.reject({ message: errorMessage });
                }
                else {
                    console.info('github request result: ' + JSON.stringify(res));
                    d.resolve(res.id);
                }
            });
            return d.promise();
        };
        return GithubAPI;
    })();
    github.GithubAPI = GithubAPI;
})(github = exports.github || (exports.github = {}));
